from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class AssistantConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'assistant'

    def ready(self):
        """
        This method is called when the Django app is ready.
        Import the consumer module and trigger the singleton creation.
        """
        try:
            logger.info("Assistant app is ready. Initializing services...")
            from . import consumer  # Import the module
            # Actually call the function to create the singleton
            consumer.get_audio_processor()
            logger.info("AudioProcessor singleton has been initialized by the app's ready() method.")
        except Exception as e:
            logger.error(f"Failed to initialize services in ready(): {e}")