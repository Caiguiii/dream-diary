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
        dream = json.loads(event['body'])
        dream['userId'] = user_id
        # Remove any None/null values DynamoDB doesn't accept
        dream = {k: v for k, v in dream.items() if v is not None}
        table.put_item(Item=dream)
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'success': True})}
    except Exception as e:
        return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': str(e)})}
