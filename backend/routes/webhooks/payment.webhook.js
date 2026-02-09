const express = require('express');
const router = express.Router();
const Loan = require('../../models/Loan');
const { getEventPublisher } = require('../../utils/eventPublisher');

const eventPublisher = getEventPublisher();

/**
 * Payment received webhook
 * Called when a customer makes a payment
 * This is the MOST IMPORTANT event - always triggers re-analysis
 */
router.post('/received', async (req, res) => {
  try {
    const {
      loan_id,
      amount,
      timestamp,
      payment_method,
      transaction_id,
      payment_status
    } = req.body;

    if (!loan_id || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: loan_id, amount'
      });
    }

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Update repayment info
    const paymentAmount = parseFloat(amount);
    
    loan.repayment.last_pymnt_d = new Date(timestamp || Date.now());
    loan.repayment.last_pymnt_amnt = paymentAmount;
    
    // Update total payments
    const currentTotal = loan.repayment.total_pymnt
      ? parseFloat(loan.repayment.total_pymnt.toString())
      : 0;
    loan.repayment.total_pymnt = currentTotal + paymentAmount;

    // Update principal received
    const currentPrincipal = loan.repayment.total_rec_prncp
      ? parseFloat(loan.repayment.total_rec_prncp.toString())
      : 0;
    loan.repayment.total_rec_prncp = currentPrincipal + paymentAmount;

    // Update loan amount left
    const loanAmount = loan.loan_details.loan_amnt
      ? parseFloat(loan.loan_details.loan_amnt.toString())
      : 0;
    const totalPaid = currentPrincipal + paymentAmount;
    const amountLeft = Math.max(0, loanAmount - totalPaid);
    
    if (!loan.contactProfile) {
      loan.contactProfile = {};
    }
    loan.contactProfile.loanAmountLeft = amountLeft;
    loan.contactProfile.lastResponseAt = new Date(timestamp || Date.now());

    // Check if loan should be marked as paid
    if (amountLeft <= 0 && loan.repayment.loan_status !== 'Fully Paid') {
      loan.repayment.loan_status = 'Fully Paid';
    } else if (loan.repayment.loan_status === 'Late (16-30 days)' ||
               loan.repayment.loan_status === 'Late (31-120 days)') {
      // Payment received while late - update to Current
      loan.repayment.loan_status = 'Current';
    }

    // Add interaction to history
    loan.addInteraction({
      channel: 'payment',
      sentAt: new Date(timestamp || Date.now()),
      status: 'completed',
      tone: 'n/a',
      payment_metadata: {
        amount: paymentAmount,
        payment_method: payment_method || 'unknown',
        transaction_id: transaction_id,
        payment_status: payment_status || 'completed'
      }
    });

    await loan.save();

    // ✅ CRITICAL: Publish PAYMENT_MADE event to Redis
    // This is the HIGHEST priority event - ALWAYS triggers Agent 1
    // Agent 1 will ALWAYS trigger Agent 2 for re-analysis after payment
    const publishResult = await eventPublisher.publish('PAYMENT_MADE', {
      loan_id,
      amount: paymentAmount,
      amount_left: amountLeft,
      timestamp: timestamp || new Date().toISOString(),
      payment_method: payment_method || 'unknown',
      transaction_id: transaction_id,
      new_loan_status: loan.repayment.loan_status,
      fully_paid: loan.repayment.loan_status === 'Fully Paid'
    }, {
      webhook_name: 'payment.received',
      metadata: {
        previous_status: loan.repayment.loan_status,
        total_paid_so_far: totalPaid,
        original_loan_amount: loanAmount
      }
    });

    res.json({
      success: true,
      message: 'Payment received and processed',
      data: {
        loan_id,
        amount_received: paymentAmount,
        amount_left: amountLeft,
        loan_status: loan.repayment.loan_status,
        event_published: publishResult.success,
        event_id: publishResult.event_id
      }
    });

  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Payment failed webhook
 * Called when a payment attempt fails
 */
router.post('/failed', async (req, res) => {
  try {
    const {
      loan_id,
      amount,
      timestamp,
      failure_reason,
      payment_method
    } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Track failed payment attempt
    loan.addInteraction({
      channel: 'payment',
      sentAt: new Date(timestamp || Date.now()),
      status: 'failed',
      tone: 'n/a',
      payment_metadata: {
        amount: parseFloat(amount),
        payment_method: payment_method || 'unknown',
        failure_reason: failure_reason || 'Unknown error'
      }
    });

    // Update loan status if needed
    if (loan.repayment.loan_status === 'Current') {
      loan.repayment.loan_status = 'In Grace Period';
    }

    await loan.save();

    // Publish event - failed payment might trigger different strategy
    await eventPublisher.publish('PAYMENT_FAILED', {
      loan_id,
      amount: parseFloat(amount),
      timestamp: timestamp || new Date().toISOString(),
      failure_reason: failure_reason,
      payment_method: payment_method
    }, {
      webhook_name: 'payment.failed'
    });

    res.json({
      success: true,
      message: 'Payment failure recorded'
    });

  } catch (error) {
    console.error('Payment failed webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Payment reminder scheduled webhook
 * Called when a payment reminder is scheduled
 */
router.post('/reminder-scheduled', async (req, res) => {
  try {
    const { loan_id, scheduled_for, channel, amount_due } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Just track it, don't trigger event
    loan.addInteraction({
      channel: channel || 'system',
      sentAt: new Date(),
      status: 'scheduled',
      tone: 'informational',
      payment_metadata: {
        scheduled_for: new Date(scheduled_for),
        amount_due: parseFloat(amount_due || 0)
      }
    });

    await loan.save();

    res.json({
      success: true,
      message: 'Payment reminder scheduled'
    });

  } catch (error) {
    console.error('Payment reminder webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;