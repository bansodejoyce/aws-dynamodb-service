'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk'); 

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
    const requestBody = JSON.parse(event.body);
    const bookname = requestBody.bookname;
    const bookdescription = requestBody.bookdescription;
    const bookDetails = {
        id: uuid.v1(),
        bookname: bookname,
        bookdescription: bookdescription
    };
    const bookInfo = {
        TableName: process.env.BOOK_TABLE,
        Item: bookDetails,
    };
    return dynamoDb.put(bookInfo).promise()
        .then(res => {
            callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                  message: `Sucessfully added book`,
                  bookId: bookDetails.id
                })
              });
        })
        .catch(err => {
            console.log(err);
            callback(null, {
                statusCode: 500,
                body: JSON.stringify({
                    message: `Unable to insert book`
                })
            })
        })
};

module.exports.list = (event, context, callback) => {
    var params = {
        TableName: process.env.BOOK_TABLE,
        ProjectionExpression: "id, bookname, bookdescription"
    };
  
    console.log("Scanning Book table.");
    const onScan = (err, data) => {
        if (err) {
            console.log('Scan failed to load data. Error JSON:', JSON.stringify(err, null, 2));
            callback(err);
        } else {
            console.log("Scan succeeded.");
            return callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    users: data.Items
                })
            });
        }
    };
    dynamoDb.scan(params, onScan);
  };