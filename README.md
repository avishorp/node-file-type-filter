# file-type-filter

A stream filter that allows only specified file types to pass, blocking all the others. The file type
is detected using [file-type](https://www.npmjs.com/package/file-type).

## Installation
```
npm install --save file-type-filter
```

## Example
```js
const FileTypeFilter = require('file-type-filter')

// Create a filter that allows only JPEGs to pass
const filter = new FileTypeFilter('image/jpeg')

// Will succeed
fs.createReadStrem('something.jpg').pipe(filter).pipe(fs.createWriteStream('output.jpg'))

// Will fail (block)
fs.createReadStrem('something.png').pipe(filter).pipe(fs.createWriteStream('output.jpg'))
filter.on('error', () => console.log('File blocked'))

```

## File Type Specification
File types that are allowed to pass are specified when a filter object is created, by passing an
argument. The argument can be any of the following

 * A string consisting of an allowed MIME type, for example `image/jpeg`
 * An array of strings of one or more allowed MIME types, for example `['application/zip', 'image/jpeg']`
 * A function, that receives the MIME type as a parameter and returns `true` if the file is allowed
   to pass.

