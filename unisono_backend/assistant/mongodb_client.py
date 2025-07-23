import pymongo
import json
from datetime import datetime, timezone
from typing import Dict, List, Optional
import logging
from urllib.parse import quote_plus

logger = logging.getLogger(__name__)

class MongoDBClient:
    def __init__(self):
        # MongoDB Atlas connection string with properly encoded credentials
        username = quote_plus("jordangan0710")
        password = quote_plus("Tp16075@1026")
        self.connection_string = f"mongodb+srv://{username}:{password}@unisono.rojvsdz.mongodb.net/?retryWrites=true&w=majority&appName=unisono"
        self.client = None
        self.db = None
        self.meetings_collection = None
        self.recordings_collection = None
        
    def connect(self):
        """Establish connection to MongoDB"""
        try:
            self.client = pymongo.MongoClient(self.connection_string)
            self.db = self.client.unisono_db
            self.meetings_collection = self.db.meetings
            self.recordings_collection = self.db.recordings
            logger.info("✅ MongoDB connection established successfully")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            return False
    
    def disconnect(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    def save_meeting(self, meeting_data: Dict) -> Optional[str]:
        """Save a new meeting to the database"""
        try:
            if self.meetings_collection is None:
                if not self.connect():
                    return None
            
            # Add timestamp with local timezone
            meeting_data['created_at'] = datetime.now()
            meeting_data['ended_at'] = None
            
            result = self.meetings_collection.insert_one(meeting_data)
            meeting_id = str(result.inserted_id)
            logger.info(f"✅ Meeting saved with ID: {meeting_id}")
            return meeting_id
        except Exception as e:
            logger.error(f"❌ Failed to save meeting: {e}")
            return None
    
    def update_meeting_end(self, meeting_id: str):
        """Mark meeting as ended"""
        try:
            if self.meetings_collection is None:
                if not self.connect():
                    return False
            
            self.meetings_collection.update_one(
                {'_id': meeting_id},
                {'$set': {'ended_at': datetime.now()}}
            )
            logger.info(f"✅ Meeting {meeting_id} marked as ended")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to update meeting end: {e}")
            return False

    def update_meeting_title(self, meeting_id: str, title: str):
        """Update meeting title"""
        try:
            if self.meetings_collection is None:
                if not self.connect():
                    return False
            
            from bson import ObjectId
            result = self.meetings_collection.update_one(
                {'_id': ObjectId(meeting_id)},
                {'$set': {'title': title}}
            )
            logger.info(f"✅ Meeting {meeting_id} title updated to: {title}")
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"❌ Failed to update meeting title: {e}")
            return False

    def delete_meeting(self, meeting_id: str):
        """Delete a meeting and all its recordings"""
        try:
            if self.meetings_collection is None or self.recordings_collection is None:
                if not self.connect():
                    return False
            
            from bson import ObjectId
            # Delete all recordings for this meeting first
            recordings_result = self.recordings_collection.delete_many({'meeting_id': meeting_id})
            logger.info(f"✅ Deleted {recordings_result.deleted_count} recordings for meeting {meeting_id}")
            
            # Delete the meeting
            meeting_result = self.meetings_collection.delete_one({'_id': ObjectId(meeting_id)})
            logger.info(f"✅ Deleted meeting {meeting_id}")
            return meeting_result.deleted_count > 0
        except Exception as e:
            logger.error(f"❌ Failed to delete meeting {meeting_id}: {e}")
            return False
    
    def save_recording(self, recording_data: Dict) -> Optional[str]:
        """Save a recording to the database"""
        try:
            if self.recordings_collection is None:
                if not self.connect():
                    return None
            
            # Add timestamp with local timezone
            recording_data['created_at'] = datetime.now()
            
            result = self.recordings_collection.insert_one(recording_data)
            recording_id = str(result.inserted_id)
            logger.info(f"✅ Recording saved with ID: {recording_id}")
            return recording_id
        except Exception as e:
            logger.error(f"❌ Failed to save recording: {e}")
            return None
    
    def get_all_meetings(self) -> List[Dict]:
        """Get all meetings ordered by creation date"""
        try:
            if self.meetings_collection is None:
                if not self.connect():
                    return []
            
            meetings = list(self.meetings_collection.find().sort('created_at', -1))
            
            # Convert ObjectId to string for JSON serialization
            for meeting in meetings:
                meeting['_id'] = str(meeting['_id'])
                # Map created_at to start_time for frontend compatibility
                if 'created_at' in meeting:
                    meeting['start_time'] = meeting['created_at'].isoformat()
                if 'ended_at' in meeting and meeting['ended_at']:
                    meeting['end_time'] = meeting['ended_at'].isoformat()
                # Add status field - all meetings should be completed since they're in history
                meeting['status'] = 'completed'
            
            return meetings
        except Exception as e:
            logger.error(f"❌ Failed to get meetings: {e}")
            return []
    
    def get_meeting_by_id(self, meeting_id: str) -> Optional[Dict]:
        """Get a specific meeting by ID"""
        try:
            if self.meetings_collection is None:
                if not self.connect():
                    return None
            
            from bson import ObjectId
            meeting = self.meetings_collection.find_one({'_id': ObjectId(meeting_id)})
            
            if meeting:
                meeting['_id'] = str(meeting['_id'])
                # Map created_at to start_time for frontend compatibility
                if 'created_at' in meeting:
                    meeting['start_time'] = meeting['created_at'].isoformat()
                if 'ended_at' in meeting and meeting['ended_at']:
                    meeting['end_time'] = meeting['ended_at'].isoformat()
                # Add status field - all meetings in detail view should be completed
                meeting['status'] = 'completed'
            
            return meeting
        except Exception as e:
            logger.error(f"❌ Failed to get meeting {meeting_id}: {e}")
            return None
    
    def get_recordings_by_meeting_id(self, meeting_id: str) -> List[Dict]:
        """Get all recordings for a specific meeting"""
        try:
            if self.recordings_collection is None:
                if not self.connect():
                    return []
            
            recordings = list(self.recordings_collection.find({'meeting_id': meeting_id}).sort('created_at', 1))
            
            # Convert ObjectId to string for JSON serialization
            for recording in recordings:
                recording['_id'] = str(recording['_id'])
                if 'created_at' in recording:
                    recording['created_at'] = recording['created_at'].isoformat()
            
            return recordings
        except Exception as e:
            logger.error(f"❌ Failed to get recordings for meeting {meeting_id}: {e}")
            return []

# Global MongoDB client instance
mongodb_client = MongoDBClient() 