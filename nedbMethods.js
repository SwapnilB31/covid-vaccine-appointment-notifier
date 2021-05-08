const db = require('nedb')

const slots = new db({filename : './slots'})

slots.loadDatabase(err => err ? console.log('error') : console.log('Connected to nedb'))

function insertIntoDB(document) {
    return new Promise((resolve,reject) => {
        slots.insert(document,(err,doc) => {
            if(err)
                reject(err)
            else
                resolve(doc)
        })
    })
}

function findInDB(query) {
    return new Promise((resolve,reject) => {
        slots.findOne(query,(err,doc) => {
            if(err)
                reject(err)
            else
                resolve(doc)
        })
    })
}

function updateDB(query,updateDoc) {
    return new Promise((resolve,reject) => {
        slots.update(query,updateDoc,{},(err,docNum)=>{
            if(err)
                reject(err)
            else
                resolve(docNum)
        })
    })
}

function deleteDocsInDB(query) {
    return new Promise((resolve,reject) => {
        slots.remove(query,{},(err,delNum) => {
            if(err)
                reject(err)
            else
                resolve(delNum)
        })
    })
}

module.exports.insertIntoDB = insertIntoDB
module.exports.findInDB = findInDB
module.exports.updateDB = updateDB
module.exports.deleteDocsInDB = deleteDocsInDB