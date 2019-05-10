'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
    const timestamp = new Date().getTime();
    const requestBody = JSON.parse(event.body);
    const customer_id = requestBody.customerid;
    const book_id = requestBody.bookid;

    const orderInfo = {
        id: uuid.v1(),
        customer_id: customer_id,
        customeremail: '',
        book_id: book_id,
        book_name: '',
        submittedAt: timestamp,
        updatedAt: timestamp,
    }
    userInfo(customer_id)
        .then(result1 => {
            console.log(result1)
            orderInfo['customeremail'] = result1.Item['email']
            return bookInfo(book_id)
        })
        .then(result2 => {
            orderInfo['book_name'] = result2.Item['bookname']
            return createOrder(orderInfo)
        })
        .then(result3 => {
            callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    message: `Order placed successfully!`,
                    orderId: result3.id
                })
            });
        })
        .catch(error => {
            console.error(error);
            callback(new Error('Somwthing went wrong.Please try later'));
            return;
        });
}

const userInfo = (customer_id) => {
    const paramsUser = {
        TableName: process.env.USER_TABLE,
        Key: {
            id: customer_id,
        },
    };
    return dynamoDb.get(paramsUser).promise()
}

const bookInfo = (book_id) => {
    const paramsBook = {
        TableName: process.env.BOOK_TABLE,
        Key: {
            id: book_id
        },
    };
    return dynamoDb.get(paramsBook).promise()
}

const createOrder = (orderDetails) => {

    const orderInfo = {
        TableName: process.env.ORDER_TABLE,
        Item: orderDetails,
    };
    return dynamoDb.put(orderInfo).promise()
}

module.exports.list = (event, context, callback) => {
    var params = {
        TableName: process.env.ORDER_TABLE,
        ProjectionExpression: "id, customer_id, customeremail,book_id,book_name"
    };

    console.log("Scanning Order table.");
    const onScan = (err, data) => {
        if (err) {
            console.log('Scan failed to load data. Error JSON:', JSON.stringify(err, null, 2));
            callback(err);
        } else {
            console.log("Scan succeeded.");
            return callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    orders: data.Items
                })
            });
        }
    };
    dynamoDb.scan(params, onScan);
}