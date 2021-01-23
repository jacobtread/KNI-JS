const axios = require('axios');
const moment = require('moment');
const parser = require('fast-xml-parser');

const KAMAR_KEY = 'vtku'; // The authentication key for KAMAR
const KAMAR_USER_AGENT = 'KAMAR/ Linux/ Android/'; // The User-Agent for KAMAR

class KNI {
    /**
     * @param {string} host The host domain of the KAMAR Portal (e.g portal.your.school.nz) or
     * provide the full url https://portal.yours.school.nz/
     * @param {boolean} isHTTPS Whether or not to use HTTPS:// with your URL (This is ignored if you provide a protocol)
     */
    constructor(host = '', isHTTPS = true) {
        if (!(host.startsWith('http://') || host.startsWith('https://'))) {
            host = (isHTTPS ? 'https://' : 'http://') + host;
        }
        if (!host.endsWith("/")) {
            host += '/'
        }
        host += 'api/api.php';
        this.url = host;
    }

    /**
     * Retrieve the notices from KAMAR using a date string
     * The date format is DD/MM/YYYY (e.g 01/01/2020)
     *
     * @param {string|null} date The date to retrieve notices for
     * Provide null or no parameters for the current date
     */
    retrieve(date = null) {
        return new Promise(((resolve, reject) => {
            if (date === null) {
                date = moment().format('DD/MM/YYYY')
            }
            const config = {
                headers: {
                    'User-Agent': KAMAR_USER_AGENT,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
            const params = new URLSearchParams();
            params.append('Key', KAMAR_KEY);
            params.append('Command', 'GetNotices');
            params.append('ShowAll', 'YES');
            params.append('Date', date);
            axios.post(this.url, params, config).then(response => {
                const data = response.data;
                if (parser.validate(data) === true) {
                    const parsed = parser.parse(data);
                    if (parsed.hasOwnProperty("NoticesResults")) {
                        const NR = parsed.NoticesResults;
                        if (NR.hasOwnProperty('Error')) {
                            reject('KAMAR ERROR: ' + NR.Error)
                        } else {
                            if(NR.hasOwnProperty("MeetingNotices") && NR.hasOwnProperty("GeneralNotices")) {
                                const notices = [];
                                const MeetingNotices = NR.MeetingNotices;
                                if(MeetingNotices.hasOwnProperty("Meeting")) {
                                    const Meetings = MeetingNotices.Meeting;
                                    for (let i = 0; i < Meetings.length; i++) {
                                        const Meeting = Meetings[i];
                                        if (
                                            Meeting.hasOwnProperty('Level')
                                            && Meeting.hasOwnProperty('Subject')
                                            && Meeting.hasOwnProperty('Body')
                                            && Meeting.hasOwnProperty('Teacher')
                                            && Meeting.hasOwnProperty('PlaceMeet')
                                            && Meeting.hasOwnProperty('DateMeet')
                                            && Meeting.hasOwnProperty('TimeMeet')
                                        ) {
                                            notices.push({
                                                level: Meeting.Level,
                                                subject: Meeting.Subject,
                                                body: Meeting.Body,
                                                teacher: Meeting.Teacher,
                                                place: Meeting.PlaceMeet,
                                                date: Meeting.DateMeet,
                                                time: Meeting.TimeMeet
                                            })
                                        }
                                    }
                                }
                                const GeneralNotices = NR.GeneralNotices;
                                if(GeneralNotices.hasOwnProperty("General")) {
                                    const Generals = GeneralNotices.General;
                                    for (let i = 0; i < Generals.length; i++) {
                                        const General = Generals[i];
                                        if (
                                            General.hasOwnProperty('Level')
                                            && General.hasOwnProperty('Subject')
                                            && General.hasOwnProperty('Body')
                                            && General.hasOwnProperty('Teacher')
                                        ) {
                                            notices.push({
                                                level: General.Level,
                                                subject: General.Subject,
                                                body: General.Body,
                                                teacher: General.Teacher
                                            })
                                        }
                                    }
                                }
                                resolve({
                                    date,
                                    notices
                                })
                            }
                        }
                    }
                } else {
                    reject('Invalid XML provided by server')
                }
            }).catch(error => reject(error))
        }))
    }

}

module.exports = KNI;