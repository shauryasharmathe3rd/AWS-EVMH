import time
import logging
from apscheduler.schedulers.blocking import BlockingScheduler
from jobs.ingest import run_bootstrap, ingest_open_meteo_weather_and_climatology, compute_ward_risks_and_vulnerabilities
from ml.demand_model import run_demand_and_anomaly_detection

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("worker.main")

def main():
    logger.info("Initializing Tript-Dhara Background Worker...")

    # Initial bootstrap
    try:
        run_bootstrap()
        run_demand_and_anomaly_detection()
    except Exception as e:
        logger.error(f"Error during worker bootstrap: {e}")

    # Set up recurring scheduler
    scheduler = BlockingScheduler()

    # Weather refresh every 30 minutes
    scheduler.add_job(
        func=ingest_open_meteo_weather_and_climatology,
        trigger="interval",
        minutes=30,
        id="weather_refresh"
    )

    # Risk & ML recomputation every 1 hour
    scheduler.add_job(
        func=compute_ward_risks_and_vulnerabilities,
        trigger="interval",
        hours=1,
        id="risk_recompute"
    )

    scheduler.add_job(
        func=run_demand_and_anomaly_detection,
        trigger="interval",
        hours=1,
        id="ml_demand_update"
    )

    logger.info("Scheduler started. Worker is active and listening.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Worker stopped.")

if __name__ == "__main__":
    main()
