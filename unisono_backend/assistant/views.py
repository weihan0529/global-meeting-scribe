from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .mongodb_client import mongodb_client

import logging

logger = logging.getLogger(__name__)

# Create your views here.

@csrf_exempt
@require_http_methods(["GET"])
def get_meeting_history(request):
    """Get all meetings for the history page"""
    try:
        meetings = mongodb_client.get_all_meetings()
        return JsonResponse({
            'success': True,
            'meetings': meetings
        })
    except Exception as e:
        logger.error(f"Error getting meeting history: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_meeting_detail(request, meeting_id):
    """Get detailed information about a specific meeting"""
    try:
        meeting = mongodb_client.get_meeting_by_id(meeting_id)
        if not meeting:
            return JsonResponse({
                'success': False,
                'error': 'Meeting not found'
            }, status=404)
        
        # Get recordings for this meeting
        recordings = mongodb_client.get_recordings_by_meeting_id(meeting_id)
        
        # Get manual insights for this meeting
        manual_insights = mongodb_client.get_manual_insights(meeting_id)
        logger.info(f"Retrieved manual insights for meeting {meeting_id}: {manual_insights}")
        
        return JsonResponse({
            'success': True,
            'meeting': meeting,
            'recordings': recordings,
            'manual_insights': manual_insights
        })
    except Exception as e:
        logger.error(f"Error getting meeting detail: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
def delete_meeting(request, meeting_id):
    """Delete a meeting and all its recordings"""
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response
    elif request.method == 'DELETE':
        try:
            success = mongodb_client.delete_meeting(meeting_id)
            if success:
                return JsonResponse({
                    'success': True,
                    'message': 'Meeting deleted successfully'
                })
            else:
                return JsonResponse({
                    'success': False,
                    'error': 'Failed to delete meeting'
                }, status=500)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    else:
        return JsonResponse({
            'success': False,
            'error': 'Method not allowed'
        }, status=405)

@csrf_exempt
@require_http_methods(["POST"])
def save_meeting(request):
    """Save a new meeting"""
    try:
        data = json.loads(request.body)
        
        # Extract meeting data
        meeting_data = {
            'title': data.get('title', 'Untitled Meeting'),
            'source_language': data.get('source_language', 'en'),
            'target_language': data.get('target_language', 'en'),
            'status': 'active'
        }
        
        meeting_id = mongodb_client.save_meeting(meeting_data)
        
        if meeting_id:
            return JsonResponse({
                'success': True,
                'meeting_id': meeting_id
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Failed to save meeting'
            }, status=500)
            
    except Exception as e:
        logger.error(f"Error saving meeting: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def save_recording(request):
    """Save a recording for a meeting"""
    try:
        data = json.loads(request.body)
        
        # Extract recording data
        recording_data = {
            'meeting_id': data.get('meeting_id'),
            'recording_id': data.get('recording_id'),
            'transcripts': data.get('transcripts', []),
            'insights': data.get('insights', []),
            'target_language': data.get('target_language', 'en'),
            'duration': data.get('duration', 0)
        }
        
        recording_id = mongodb_client.save_recording(recording_data)
        
        if recording_id:
            return JsonResponse({
                'success': True,
                'recording_id': recording_id
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Failed to save recording'
            }, status=500)
            
    except Exception as e:
        logger.error(f"Error saving recording: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def end_meeting(request, meeting_id):
    """Mark a meeting as ended"""
    try:
        success = mongodb_client.update_meeting_end(meeting_id)
        
        if success:
            return JsonResponse({
                'success': True,
                'message': 'Meeting ended successfully'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Failed to end meeting'
            }, status=500)
            
    except Exception as e:
        logger.error(f"Error ending meeting: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


