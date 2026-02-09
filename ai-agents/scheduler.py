"""
Scheduler - Runs agent automatically at intervals
"""
import schedule
import time
import logging
from agent import CollectionAgent
from config import SCHEDULE_INTERVAL_MINUTES, BATCH_SIZE

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_scheduled_batch():
    """Run batch processing on schedule"""
    logger.info("⏰ Scheduled batch job triggered")
    
    agent = CollectionAgent()
    
    # Check health first
    if not agent.mcp_client.health_check():
        logger.error("❌ Backend not reachable, skipping this run")
        return
    
    # Process batch
    agent.process_batch(
        limit=BATCH_SIZE,
        priority_filter=3,  # Only high/medium priority
        use_ai_generation=True,
        dry_run=False
    )


def main():
    """Main scheduler"""
    logger.info(f"🤖 AI Agent Scheduler Started")
    logger.info(f"📅 Running every {SCHEDULE_INTERVAL_MINUTES} minutes")
    logger.info(f"📦 Batch size: {BATCH_SIZE}")
    logger.info(f"🔄 Press Ctrl+C to stop\n")
    
    # Schedule the job
    schedule.every(SCHEDULE_INTERVAL_MINUTES).minutes.do(run_scheduled_batch)
    
    # Run once immediately
    run_scheduled_batch()
    
    # Keep running
    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\n👋 Scheduler stopped")
