
const chai = require('chai')
const expect = chai.expect
const fs = require('fs')
const NullDuplexStream = require('null-duplex-stream')
const ByteCounter = require('stream-counter')

const FileTypeFilter = require('../lib/file-type-filter')

describe('File type filter', () => {
    it('Allow file to pass (single type)', (done) => {
        const inputStream = fs.createReadStream('test/sample.jpg')
        const filter = new FileTypeFilter('image/jpeg')
        const counterStream = new ByteCounter()

        const p = inputStream.pipe(filter).pipe(counterStream)
        counterStream.on('finish', () => {
            expect(counterStream.bytes).to.equal(69214)
            done()
        }) 
    })

    it('Disallow file to pass (single type)', (done) => {
        const inputStream = fs.createReadStream('test/sample.zip')
        const filter = new FileTypeFilter('image/jpeg')
        const counterStream = new ByteCounter()

        const p = inputStream.pipe(filter).pipe(counterStream)
        filter.on('error', () => {
            expect(counterStream.bytes).to.equal(0)
            done()
        }) 
    })

    it('Allow file to pass (multiple types)', (done) => {
        const inputStream1 = fs.createReadStream('test/sample.jpg')
        const filter1 = new FileTypeFilter(['image/jpeg', 'application/zip'])
        const counterStream1 = new ByteCounter()

        const inputStream2 = fs.createReadStream('test/sample.zip')
        const filter2 = new FileTypeFilter(['image/jpeg', 'application/zip'])
        const counterStream2 = new ByteCounter()


        const p1 = inputStream1.pipe(filter1).pipe(counterStream1)
        const p2 = inputStream2.pipe(filter2).pipe(counterStream2)

        counterStream1.on('finish', () => {
            expect(counterStream1.bytes).to.equal(69214)

            counterStream2.on('finish', () => {
                expect(counterStream2.bytes).to.equal(69218)
                done()
            })
        }) 
    })
})
