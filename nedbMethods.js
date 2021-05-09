const db = require('nedb')

const slots = new db({filename : './slots'})

//slots.persistence.setAutocompactionInterval(10000)

slots.loadDatabase(err => err ? console.log('error') : console.log('Connected to nedb'))

function insertIntoDB(document) {
    console.log('Inserting Dcument...')
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
    console.log('Findng Dcument...')
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
    console.log('uodating doc ')
    console.log(query)
    console.log(updateDoc)
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