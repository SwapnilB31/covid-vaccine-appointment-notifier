## Covid-Vaccine-Appointment-Finder

Covid-19 vaccine appointments in India have become scarce and difficult to make. With the rush of people trying to get a slot, getting it manually using [CoWin](https://cowin.gov.in) or [Arogya Setu](https://mygov.in/aarogya-setu-app/) has become and ardous task. This node.js app intends to remedy that. Using [puppeteer](https://www.npmjs.com/package/puppeteer) it commands a headless Chromium instance and polls the cowin-api as much as 50 times in a minute (bypasing the rate limit of 100 calls/ 5 min for the public API) by calling a private API endpoint and simulating real user interaction. It looks for available vaccination sessions in the district you supply in the config file in the next six days and sends you an email notifying you available slots as and when they become available. It is completely open source and requires you to do a lot of the work to set it up. Please keep that in mind before you decide to use it.

## Dependencies 

* [puppeteer](https://www.npmjs.com/package/puppeteer)
* [nodemailer](https://www.npmjs.com/package/nodemailer)
* [googleapis](https://www.npmjs.com/package/googleapis)
* [nedb][https://www.npmjs.com/package/nedb]

Please note that puppeteer needs a GUI environment to run. If you want to run it on the server you might need to install GTK/Gnome first.

## Setup

* node-mailer : node-mailer is configured here to send emails using your Gmail account (If you want to use any other provider, edit the `sendEmail.js` file to implement it). To be able to do that you need to create an OAuth Key on the Google Cloud Platform. OAuth has been chosen as the authentication mode as Gmail really dislikes plain text passwords. You can setup less secure apps on your account, but even then it breaks from time to time and jeopardizes the application's ability to notfy you in a timely manner. Lot of the steps involved in creating and using OAuth with Gmail and node-mailer can be found in [this article](https://medium.com/@nickroach_50526/sending-emails-with-node-js-using-smtp-gmail-and-oauth2-316fe9c790a1). But some of the details are outdated. Go around them by following these steps:
    * After creating your project, Go to [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) to get to the APIs and credentials tab directly and select Create Credentials to generate the client id and client secret.
    * Before moving on to getting the refresh token from [https://developers.google.com/oauthplayground](https://developers.google.com/oauthplayground) select the Web Client from the list of projects in the Credentials tab and add `https://developers.google.com/oauthplayground` as an authorized redirect url.
    * Go to the OAuth consent screen tab and publish your app before you try to get the refresh token. If your app is in testing mode you won't be able to get the refresh_token

## Configuration

You need to populate two config files:
1. `.env`: This file contains sensitive information like OAuth Client ID, Client Secret and Refresh token. Edit the `sample.env` file and populate it with the Tokens you generated while creating the project on GCP. These will be used to send emails over your gmail account. Also save the Sender Email Address in this file. After editing this file, rename it to be just `.env`

2. `config.js`: Edit the `sample.config.js` file and rename it as `config.js` to specify these paramters:
    * `recipientEmail`: This the email Id of the user who wishes to recieve notifications for slot availability. This can be the same as the sender email address
    * `districtID`: it is the ID of the district you want to search for as defined in the Cowin API. You can find it out by querying the CoWin Public API. To find the stateID goto [https://cdn-api.co-vin.in/api/v2/admin/location/states](https://cdn-api.co-vin.in/api/v2/admin/location/states) make note of the your stateID and then goto `https://cdn-api.co-vin.in/api/v2/admin/location/districts/{state_id}` to find your districtID
    * `timeOut`: duration in seconds between each time the application runs and queries the API. Minimum value is `7.5`. Please note that the application queries the API 6 times, every time it runs.
    * `chromeHeadless`: boolean value that specifies whether the chromium instance runs in the background (headless) or is painted on the GUI.

    ## Installation
    Run
    ```
        npm install
    ```
    to install all the dependencies

    ## Execution
    Run 
    ```
        npm start
    ```

    to run the application.

    ## Issues

    If the app is broken and throwing up errors, it could be because the API endpoint or the result schema has undergone changes that make the application incompatible with it. If the app starts throwing out errors, create an issue and paste the entire error stack trace in the issue. Valid issues will be taken up and resolved periodically.

    ## Contribution

    Contributions are welcome from the open source community. All PRs will be evaluated and merged as long as they don't break the core functionality (Enhancements are always welcome).

