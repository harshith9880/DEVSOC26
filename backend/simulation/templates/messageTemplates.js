/**
 * Message Templates for different tones and channels
 */
const messageTemplates = {
  email: {
    informational: {
      subject: "EMI Payment Reminder - {loan_id}",
      body: `Dear {customer_name},

This is a friendly reminder that your EMI payment of ₹{emi_amount} is due soon.

Loan ID: {loan_id}
Amount Due: ₹{emi_amount}
Outstanding Balance: ₹{loan_amount_left}

Please click below to make your payment:
{payment_link}

Thank you for your prompt attention.

Best regards,
Finance Team`
    },
    
    empathetic: {
      subject: "We're here to help - EMI Payment for {loan_id}",
      body: `Dear {customer_name},

We understand that managing finances can sometimes be challenging. We wanted to reach out regarding your upcoming EMI payment of ₹{emi_amount}.

Loan ID: {loan_id}
Amount Due: ₹{emi_amount}

If you're facing any difficulties, we're here to help. Please reach out to us or make your payment here:
{payment_link}

We appreciate your partnership.

Warm regards,
Finance Team`
    },
    
    supportive: {
      subject: "EMI Payment Support - {loan_id}",
      body: `Dear {customer_name},

We notice your EMI payment of ₹{emi_amount} is approaching. We're here to make this easy for you!

Loan Details:
- Loan ID: {loan_id}
- Amount Due: ₹{emi_amount}
- Remaining Balance: ₹{loan_amount_left}

Make your payment: {payment_link}

Need help? Contact us anytime.

Thank you,
Finance Team`
    },
    
    urgent: {
      subject: "URGENT: EMI Payment Required - {loan_id}",
      body: `Dear {customer_name},

IMMEDIATE ATTENTION REQUIRED

Your EMI payment of ₹{emi_amount} is overdue. Please make the payment immediately to avoid late fees and impact on your credit score.

Loan ID: {loan_id}
Amount Due: ₹{emi_amount}
Payment Link: {payment_link}

Contact us immediately if you need assistance: {support_phone}

Finance Team`
    }
  },

  sms: {
    informational: {
      text: "EMI Reminder: Your payment of ₹{emi_amount} is due for loan {loan_id}. Pay now: {payment_link}",
      hasLink: true
    },
    
    empathetic: {
      text: "Hi {customer_name}, we understand times can be tough. Your EMI of ₹{emi_amount} is due. We're here to help: {payment_link}",
      hasLink: true
    },
    
    supportive: {
      text: "Friendly reminder: EMI of ₹{emi_amount} due for {loan_id}. Quick pay: {payment_link} Need help? Reply to this message.",
      hasLink: true
    },
    
    urgent: {
      text: "URGENT: EMI of ₹{emi_amount} OVERDUE for {loan_id}. Pay immediately: {payment_link} or call {support_phone}",
      hasLink: true
    }
  },

  whatsapp: {
    informational: {
      text: `Hello {customer_name}! 👋

Your EMI payment reminder:
💰 Amount: ₹{emi_amount}
🆔 Loan: {loan_id}

Pay securely: {payment_link}

Thank you! 🙏`
    },
    
    empathetic: {
      text: `Hi {customer_name},

We hope you're doing well. 😊

Just a gentle reminder about your EMI of ₹{emi_amount} for loan {loan_id}.

If you need any support, we're here for you.

Pay here: {payment_link}

Take care! 💙`
    },
    
    supportive: {
      text: `Hey {customer_name}! 🌟

Quick reminder: Your EMI of ₹{emi_amount} is due.

Loan ID: {loan_id}
Quick Payment: {payment_link}

Need help? Just reply to this message!

Cheers! ✨`
    },
    
    urgent: {
      text: `⚠️ IMPORTANT - {customer_name}

Your EMI payment of ₹{emi_amount} is OVERDUE!

Loan: {loan_id}
IMMEDIATE ACTION REQUIRED

Pay now: {payment_link}
Or call: {support_phone}

Please act immediately to avoid penalties.`
    }
  },

  call: {
    informational: {
      script: "Hello, this is a reminder about your EMI payment.",
      duration: "short"
    },
    
    empathetic: {
      script: "Hello, we're calling to discuss your EMI payment. We're here to help if you need assistance.",
      duration: "medium"
    },
    
    supportive: {
      script: "Hi, we wanted to remind you about your upcoming EMI payment and see if you need any support.",
      duration: "medium"
    },
    
    urgent: {
      script: "This is an urgent call regarding your overdue EMI payment. Please make the payment immediately.",
      duration: "short"
    }
  }
};

/**
 * Format message with customer data
 */
function formatMessage(channel, tone, loanData) {
  const template = messageTemplates[channel][tone];
  
  if (!template) {
    throw new Error(`Template not found for ${channel} - ${tone}`);
  }

  const formatted = JSON.parse(JSON.stringify(template));
  
  // Extract customer name from loan data (or use default)
  const customerName = loanData.customer_contact?.name || 'Valued Customer';
  
  const replacements = {
    customer_name: customerName,
    loan_id: loanData.id,
    emi_amount: parseFloat(loanData.loan_details.installment.toString()).toFixed(2),
    loan_amount_left: loanData.contactProfile.loanAmountLeft.toFixed(2),
    payment_link: `https://pay.example.com/${loanData.id}`,
    support_phone: "+91-1800-XXX-XXXX"
  };

  Object.keys(formatted).forEach(key => {
    if (typeof formatted[key] === 'string') {
      Object.keys(replacements).forEach(placeholder => {
        formatted[key] = formatted[key].replace(
          new RegExp(`\\{${placeholder}\\}`, 'g'),
          replacements[placeholder]
        );
      });
    }
  });

  return formatted;
}


module.exports = {
  messageTemplates,
  formatMessage
};
