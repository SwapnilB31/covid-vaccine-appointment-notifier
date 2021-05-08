const puppeteer = require('puppeteer')
const sendEmail = require('./sendEmail')
const {findInDB, insertIntoDB, updateDB, deleteDocsInDB} = require('./nedbMethods')
const util = require('util')

function timeOut(time) {
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            resolve(true)
        },time)
    })
}

async function getSlotsInDate(districtID) {
    try {
        const browser = await puppeteer.launch({headless : false})
        const page = await browser.newPage()
        let centerLists = []
        for(let ind = 0; ind < 6; ind++) {
            const page = await browser.newPage()
            await page.goto(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtID}&date=${DateFromToday(ind)}`)
            await page.waitForSelector('pre')
            let centerList = await page.evaluate(() => {
                const pre = document.querySelector('pre')
                const centersList = JSON.parse(pre.innerText)
                return centersList
            })
            centerList = centerList.centers.map(val => {
                const centerName = val.name
                const pinCode = val.pincode
                const block = val.block_name
                const address = val.address
                const minAge = val.sessions[0].min_age_limit
                const slotsAvailable = val.sessions[0].available_capacity
                return {
                    centerName,
                    pinCode,
                    block,
                    address,
                    minAge,
                    slotsAvailable,
                    searchDate : DateFromToday(ind) 
                }
            }).filter(val => val.slotsAvailable > 0)
            //console.log(centerList)
            centerLists.push(...centerList)
        }
        try {
            let pages = await browser.pages()
            await Promise.all(pages.map(page => page.close()))
        } catch(err) {
            console.log(err)
        }

        //await timeOut(3 * 60 * 1000)
        try {
            await browser.close()
        } catch(err) {
            console.log(err)
        }

        return centerLists
    } catch(err) {
        console.log(err)
        return []
    }
    
}

function DateFromToday(offset) {
    const date = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toUTCString().replace(/GMT$/,'')
    const offSetDate = new Date(new Date(date).getTime() + offset * 24 * 60 * 60 * 1000)
    let day = offSetDate.getDate()
    day = day < 10 ? `0${day}` : `${day}` 
    let month = offSetDate.getMonth() + 1
    month = month < 10 ? `0${month}` : `${month}`
    let year = offSetDate.getFullYear()
    
    return `${day}-${month}-${year}`
}

function makeDateDBFreindly(dateStr) {
    const parts = dateStr.split('-')
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
}

async function run() {
    const centersArray = []
    const centerList = await getSlotsInDate(50)
    //console.log(centerList)

    const changedOrModifiedCenters = []

    for(let i = 0; i < centerList.length; i++) {
        const currCenter = centerList[i]
        try{
            const found = await findInDB({centerName : currCenter.centerName, date : makeDateDBFreindly(currCenter.searchDate)})
            console.log({centerName : currCenter.centerName, date : makeDateDBFreindly(currCenter.searchDate)})
            if(found === null || found.length && found.length === 0) {
                changedOrModifiedCenters.push(currCenter)
                await insertIntoDB({...currCenter, date : makeDateDBFreindly(currCenter.searchDate)})
            }
            else if(found && found.slotsAvailable && found.slotsAvailable !== currCenter.slotsAvailable) {
                console.log({found})
                if(currCenter.slotsAvailable === 0)
                    await deleteDocsInDB({centerName : currCenter.centerName, date : makeDateDBFreindly(currCenter.searchDate)})
                else {
                    await updateDB({...currCenter, date : makeDateDBFreindly(currCenter.searchDate)}, {slotsAvailable : currCenter.slotsAvailable})
                    changedOrModifiedCenters.push(currCenter)
                }
            }
        }
        catch(err) {
            console.log(err)
        }
    }
    
    let html = `
    <table style = 'border-collapse: collapse; border: 1px solid black;'>
        <tr>
            <th style='border: 1px solid black;'>Name</th>
            <th style='border: 1px solid black;'>Block</th>
            <th style='border: 1px solid black;'>Adress</th>
            <th style='border: 1px solid black;'>PIN Code</th>
            <th style='border: 1px solid black;'>Min Age</th>
            <th style='border: 1px solid black;'>Slots</th>
            <th style='border: 1px solid black;'>Date</th>
        </tr>
    `
    for(let i = 0; i < changedOrModifiedCenters.length; i++) {
        html += `
            <tr>
                <td style='border: 1px solid black;'>${changedOrModifiedCenters[i].centerName}</td>
                <td style='border: 1px solid black;'>${changedOrModifiedCenters[i].block}</td>
                <td style='border: 1px solid black;'>${changedOrModifiedCenters[i].address}</td>
                <td style='border: 1px solid black;'>${changedOrModifiedCenters[i].pinCode}</td>
                <td style='border: 1px solid black;'>${changedOrModifiedCenters[i].minAge}</td>
                <td style='border: 1px solid black;'>${changedOrModifiedCenters[i].slotsAvailable}</td>
                <td style='border: 1px solid black;'>${changedOrModifiedCenters[i].searchDate}</td>
            </tr>
        `
    }
    html += `</table>`

    const subject = `New slots available for Vaccination Appointment`

    if(changedOrModifiedCenters.length > 0)
        await sendEmail('swapnilbhattacharjee187@gmail.com',subject,html)
    else
        console.log('email not sent')
}

run()
setInterval(() => {
    run()
},10 * 60 * 1000)
