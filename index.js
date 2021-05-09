const puppeteer = require('puppeteer')
const sendEmail = require('./sendEmail')
const {findInDB, insertIntoDB, updateDB, deleteDocsInDB} = require('./nedbMethods')
const config = require('./config')
config.timeOut = config.timeOut < 7.5 ? 7.5: config.timeOut

const browserPromise = puppeteer.launch({
    headless : config.chromeHeadless,
    args : [
        "--no-sandbox"
    ]
})


function timeOut(time) {
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            resolve(true)
        },time)
    })
}



async function getSlotsFor6DaysPuppeteer(districtID) {
    try {
        const browser = await browserPromise
        const page = await browser.newPage()
        let centerLists = []
        for(let ind = 0; ind < 6; ind++) {
            const page = await browser.newPage()
            page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36")
            await page.goto(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtID}&date=${DateFromToday(ind)}`)
            await page.waitForSelector('pre')
            //await page.screenshot({path : `./tab-${ind}.png`})
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
            centerLists.push(...centerList)
        }
        try {
            let pages = await browser.pages()
            await Promise.all(pages.map(page => page.close()))
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
    const centerList = await getSlotsFor6DaysPuppeteer(config.districtID)

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
                    await updateDB({centerName : currCenter.centerName, date : makeDateDBFreindly(currCenter.searchDate)}, {slotsAvailable : currCenter.slotsAvailable})
                    //changedOrModifiedCenters.push(currCenter)
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

    const subject = `New slots available for Vaccination Appointment ${new Date().toString()}`

    if(changedOrModifiedCenters.length > 0)
        await sendEmail(config.recipientEmail,subject,html)
    else
        console.log('email not sent ' + new Date().toString())
}


run()
setInterval(() => {
    run()
},config.timeOut * 1000)

async function exitHandler() {
    const browser = await browserPromise
    await browser.close()
}

//Exit
process.on('exit',exitHandler.bind(null,{cleanup:true}))

//Ctrl+C
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//"kill pid"
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
