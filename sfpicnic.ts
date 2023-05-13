import { Command } from 'commander';
import { FACILITY_IDS } from './facility_ids'
import * as fs from 'node:fs/promises';
import fetch from 'cross-fetch';
import { JSDOM } from 'jsdom';

const program = new Command();
program
  .version('1.0.0')
  .description('Gets a list of picnic areas available for reservation from San Francisco Parks.')
  .requiredOption('-d, --date [value]', 'Date to query for available reservations, in YYYY-MM-DD format.')
  .requiredOption('-o, --outFile [value]', 'Path to which to save html reservation info.')
  .parse(process.argv);
const options = program.opts();

const dateComponents = options.date.match(/^(\d\d\d\d)-(\d\d)-(\d\d)$/)
if (!dateComponents) {
  throw new Error('Please give --date option in YYYY-MM-DD format.');
}
const year = dateComponents[1];
const month = dateComponents[2].replace(/^0/, '');
const day = dateComponents[3].replace(/^0/, '');

let out = '<table cellpadding=3 border=1><tr><th>facility</th><th>center</th><th>actions</th></tr>';
let fetchPromises = [];

for (const id of FACILITY_IDS) {
  const url = 'https://apm.activecommunities.com/sfrecpark/facility_search' +
    `?IsCalendar=true&facility_id=${id}&year=${year}&month=${month}&startyear=${year}&endyear=${year}`;
  fetchPromises.push(fetch(url).then(resp => resp.text()).then(function (documentText) {
    const dom = new JSDOM(documentText);
    const document = dom.window.document;

    const facilityTable = document.querySelectorAll('table.an-facilities-calendar-detailstable td');
    const facility = facilityTable[1].textContent;
    const center = facilityTable[2].textContent;

    let dateTds = [...document.querySelectorAll('td[align=right]')];
    const targetDateCell = dateTds.filter(e => e.textContent == day)[0];
    const reservationCell = targetDateCell.parentElement?.nextElementSibling?.querySelector('a');
    if (reservationCell && reservationCell.innerHTML.indexOf(' to ') > 0) {
      const centerLink = 'https://www.google.com/search?q=san+francisco+park+' + center?.replace(/ /g, '+');
      const reserveLink = `https://apm.activecommunities.com/sfrecpark/ActiveNet_Home?FileName=makeOnlineQuickReservation.sdi&facility_id=${id}&online=true&check_availability=true&quick_finish=true&begy=${year}&begm=${month}&begd=${day}&IsCalendar=true&TypeID=0&LocationID=0&KeywordID=0&year=${year}&month=${month + 1}&startyear=${year}&endyear=${year}`;
      out += `<tr><td>${facility}</td><td><a href="${centerLink}">${center}</a></td><td><a href="${url}">calendar</a> <a href="${reserveLink}">reserve</a></td></tr>`;
    }
  }));
}

Promise.allSettled(fetchPromises).then(function () {
  out += '</table>';
  fs.writeFile(options.outFile, out);
});