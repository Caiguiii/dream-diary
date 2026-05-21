import json
import os
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
}

def handler(event, context):
    try:
        user_id = event['requestContext']['authorizer']['jwt']['claims']['sub']
        response = table.query(
            KeyConditionExpression=Key('userId').eq(user_id)
        )
        dreams = response.get('Items', [])
        dreams.sort(key=lambda d: d.get('createdAt', ''), reverse=True)
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(dreams)}
    except Exception as e:
        return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': str(e)})}
