import json
import os
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
}

def to_decimal(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [to_decimal(i) for i in obj]
    return obj

def handler(event, context):
    try:
        user_id = event['requestContext']['authorizer']['jwt']['claims']['sub']
        dream = json.loads(event['body'])
        dream['userId'] = user_id
        # Remove null values DynamoDB doesn't accept
        dream = {k: v for k, v in dream.items() if v is not None}
        # Convert floats to Decimal (boto3 DynamoDB requirement)
        dream = to_decimal(dream)
        table.put_item(Item=dream)
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'success': True})}
    except Exception as e:
        return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': str(e)})}
