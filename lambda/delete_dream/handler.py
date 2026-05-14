import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
}

def handler(event, context):
    try:
        user_id = event['requestContext']['authorizer']['jwt']['claims']['sub']
        dream_id = event['pathParameters']['id']
        table.delete_item(Key={'userId': user_id, 'id': dream_id})
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'success': True})}
    except Exception as e:
        return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': str(e)})}
