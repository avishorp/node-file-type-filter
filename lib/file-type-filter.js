'use strict'

const util = require('util')
const assert = require('assert')
const Transform = require("stream").Transform || require("readable-stream/transform")
const fileType = require('file-type')

// The maximum number of bytes required by the
// file-type module in order to classify a file
const BYTES_REQUIRED = 4100  

// Filter states
const STATE_UNCLASSIFIED = 0  // The stream type is not known yet
const STATE_ALLOWED      = 1  // The stream type is known and allowed
const STATE_BLOCKED      = 2  // The stream type is disallowed

const ERROR_MESSAGE = "Stream type not allowed"

function FileTypeFilter(allowedTypes) {
    // Argument checking: allowedTypes must be either an array or a function
    assert((Array.isArray(allowedTypes)) || (typeof allowedTypes === 'function') || (typeof allowedTypes === 'string'))

    Transform.call(this)

    // Prepare a buffer that fill be used by file-type
    // to classify the data.
    this.classificationBuf = new Buffer(BYTES_REQUIRED)
    this.classificationBytes = 0
    this.state = STATE_UNCLASSIFIED
    this.allowedTypes = allowedTypes

    // Clean the classification buffer
    this.classificationBuf.fill(0)
}

util.inherits(FileTypeFilter, Transform)

FileTypeFilter.prototype._transform = function(chunk, encoding, cb) {
    if (this.state === STATE_ALLOWED) {
        // Stream is allowed, nothing more to do
        this.push(chunk)
        cb()
    }
    else if (this.state === STATE_BLOCKED) {
        // Stream is blocked, generate an error
        cb(new Error(ERROR_MESSAGE))
    }
    else {
        // STATE_UNCLASSIFIED

        // Copy the new chunk into the buffer, but never more
        // than the size of the buffer
        chunk.copy(this.classificationBuf, this.classificationBytes)
        this.classificationBytes += chunk.length

        // Check if the file type can be determined
        const t = fileType(this.classificationBuf)

        if (t) {
            if (this._isAllowed(t.mime)) {
                this.state = STATE_ALLOWED
                this.push(chunk)
                cb()
            }
            else {
                this.state = STATE_BLOCKED
                cb(new Error(ERROR_MESSAGE))
            }
        }
        else {
            if (this.classificationBytes >= BYTES_REQUIRED) {
                // If there are enough bytes in the buffer, but it's still not classified -
                // block it
                this.state = STATE_BLOCKED
                cb(new Error(ERROR_MESSAGE))
            }            
        }

    }
}

FileTypeFilter.prototype._isAllowed = function(type) {
    if (typeof this.allowedTypes === 'string')
        // Allowed type is a string. Match the given type against it
        return (type === this.allowedTypes)

    else if (typeof this.allowedTypes === 'function')
        // Allowed type is a function. Call it with the given type
        return this.allowedTypes.call(null, type)

    else
        // Allowed type is an array. Try to find the given type in it
        return (this.allowedTypes.indexOf(type) >= 0)
}

module.exports = FileTypeFilter


