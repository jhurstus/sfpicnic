# sfpicnic
Gets a list of picnic areas available for reservation from San Francisco Parks.
&amp; Rec.

Sample usage:
```
$ npm install
$ npx tsc
$ node dist/sfpicnic.js -d 2023-05-20 -o /tmp/list_of_available_picnic_sites.html
```

This is a quick and dirty script that scrapes info from the SF Parks &amp; Rec's
picnic reservation web page.  This script will likely break if that UI is ever
changed. 