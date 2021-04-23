import {AxiosError, AxiosRequestConfig, AxiosResponse} from "axios";

const axios = require('axios');
// We need format and parse from date-fns for parsing and formatting dates
const {format, parse} = require('date-fns');
// We need
const parser = require('fast-xml-parser');

const KAMAR_CONSTANTS = {
    key: 'vtku',
    userAgent: 'KAMAR/ Linux/ Android/'
};

interface Notice {
    level: string | 'All' | 'Juniors' | 'Seniors';
    subject: string;
    body: string;
    teacher: string;
}

interface MeetingNotice extends Notice {
    place: string;
    date: Date | null;
    time: string;
}

interface KNIResponse {
    general: Notice[];
    meetings: MeetingNotice[];
    all: Array<Notice | MeetingNotice>;
}

class KNI {
    url: string

    constructor(host: string, useHTTPS: boolean = true) {
        if (!host.match(/^http(s)?:\/\/.*$/)) { // Check if the host starts with https:// or http://
            host = (useHTTPS ? 'https' : 'http') + '://' + host; // If not we should append it
        }
        if (host.charAt(host.length - 1) != '/') { // Check if the host ends with a /
            host += '/'; // If not we should add one
        }
        host += 'api/api.php'; // Appending the api file to the url
        this.url = host; // Set the url
    }

    get(inDate: string | Date | null = null): Promise<KNIResponse> {
        return new Promise((resolve, reject) => {
            const inFormat: string = 'dd/MM/yyyy';
            let date: string;
            if (inDate == null) {
                date = format(new Date(), inFormat); // Format the current date
            } else {
                if (typeof inDate == 'string') {
                    date = inDate; // Use the provided string
                } else {
                    date = format(inDate, inFormat); // Format the provided date object
                }
            }
            const params: URLSearchParams = new URLSearchParams();
            params.append('Key', KAMAR_CONSTANTS.key); // Use the default authentication key
            params.append('Command', 'GetNotices'); // The KAMAR command for notices
            params.append('ShowAll', 'YES'); // Usage Unknown but provided in app
            params.append('Date', date.toString()); // The provided date
            const config: AxiosRequestConfig = {
                url: this.url,
                method: 'POST', // Request must be over POST
                headers: {
                    'User-Agent': 'KAMAR/ Linux/ Android/', // KAMAR Requires a special User-Agent
                    'Content-Type': 'application/x-www-form-urlencoded' // KAMAR requires x-www-form-urlencoded content
                },
                data: params,
                transformResponse: data => {
                    data = data.replace('&amp;', '&'); // Replace all encoded & symbols with &
                    if (!parser.validate(data)) {
                        reject('Invalid xml response from server');
                    }
                    return parser.parse(data); // Parse the xml object to js object
                }
            }
            axios.request(config).then((response: AxiosResponse) => {
                if (response.status != 200) {
                    reject(`Unable to connect to KAMAR responded with: ${response.status} ${response.statusText}`)
                } else {
                    if (!response.data.hasOwnProperty("NoticesResults")) {
                        reject('Invalid response from KAMAR')
                    } else {
                        const result: any = response.data.NoticesResults; // The main response xml object
                        const general: Notice[] = []; // The general notices array
                        const meetings: MeetingNotice[] = []; // The meeting notices array
                        if (result.hasOwnProperty("GeneralNotices")) { // Make sure the xml has general notices
                            const generalNotices = result.GeneralNotices; // Get the general notices object
                            if (generalNotices.hasOwnProperty("General")) { // Make sure there is notice children
                                const kGeneral = generalNotices.General; // Get the notice children
                                kGeneral.forEach((notice: any) => { // Loop through all the notices
                                    if (notice.hasOwnProperty("Level") // Make sure the notice has a level
                                        && notice.hasOwnProperty("Subject") // Make sure the notice has a subject
                                        && notice.hasOwnProperty("Body") // Make sure the notice has a body
                                        && notice.hasOwnProperty("Teacher") // Make sure the notice has a teacher
                                    ) {
                                        // Push the notice to the general notices
                                        general.push({
                                            level: notice.Level,
                                            subject: notice.Subject,
                                            body: notice.Body,
                                            teacher: notice.Teacher,
                                        });
                                    }
                                });
                            }
                        }
                        if (result.hasOwnProperty("MeetingNotices")) { // Make sure the xml has meeting notices
                            const meetingNotices = result.MeetingNotices; // Get the meeting notices object
                            if (meetingNotices.hasOwnProperty("Meeting")) { // Make sure there is notice children
                                const kMeetings = meetingNotices.Meeting; // Get the notice children
                                kMeetings.forEach((notice: any) => { // Loop through all the notices
                                    if (notice.hasOwnProperty("Level") // Make sure the notice has a level
                                        && notice.hasOwnProperty("Subject") // Make sure the notice has a subject
                                        && notice.hasOwnProperty("Body") // Make sure the notice has a body
                                        && notice.hasOwnProperty("Teacher") // Make sure the notice has a teacher
                                        && notice.hasOwnProperty("DateMeet") // Make sure the notice has a date
                                        && notice.hasOwnProperty("PlaceMeet") // Make sure the notice has a place
                                        && notice.hasOwnProperty("TimeMeet") // Make sure the notice has a time
                                    ) {
                                        // We can parse the date because its a constant format unlike the time and place
                                        const dateMeet = notice.DateMeet; // Get the notice time
                                        let date: Date | null; // Placeholder for the date
                                        if (dateMeet == null || dateMeet.length < 1) { // If there is no date
                                            date = null; // Set date to null
                                        } else {
                                            date = parse(dateMeet, 'yyyy-MM-dd', new Date()); // Parse the date
                                        }
                                        // Push the notice to the meeting notices
                                        meetings.push({
                                            level: notice.Level,
                                            subject: notice.Subject,
                                            body: notice.Body,
                                            teacher: notice.Teacher,
                                            date: date,
                                            place: notice.PlaceMeet,
                                            time: notice.TimeMeet
                                        });
                                    }
                                });
                            }
                        }
                        const all = general.concat(meetings); // Create the all notices array by joining the two arrays
                        resolve({general, meetings, all}); // Resolve with the data
                    }
                }
            }).catch((err: AxiosError) => {
                reject(err.message); // Reject because the request failed
            });
        });
    }
}

module.exports = KNI; // Export the KNI class