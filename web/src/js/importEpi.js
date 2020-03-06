import {
  timeParse,
  isoParse,
  nest,
  sum,
  timeFormat,
  map
} from 'd3';

import store from "@/store";

export function getRegion(country) {
  const regionDict = store.state.regionDict;

  const region = regionDict.filter(d => d.countries.includes(country));

  if (region.length === 1) {
    return (region[0].region)
  }
}

export function cleanEpi(data) {
  const parseDate = timeParse("%m/%d/%y");
  const formatDate = timeFormat("%m-%d-%y");

  data.forEach(d => {
    const metadata = {
      'province': d['Province/State'],
      'placeName': d['Province/State'],
      'country': d['Country/Region'],
      'region': getRegion(d['Country/Region']),
      lat: d["Lat"],
      lon: d["Long"]
    };
    delete d['Province/State'];
    delete d['Country/Region'];
    delete d['Lat'];
    delete d['Long'];
    const keys = Object.keys(d);

    d['data'] = keys.map(timepoint => {
      return ({
        "date": parseDate(timepoint),
        "date_string": formatDate(parseDate(timepoint)),
        "cases": +d[timepoint],
        "country": metadata.country,
        "region": metadata.region,
        "id": metadata.placeName.replace(/,\s/g, "_").replace(/\s/g, "_").replace(/\(/g, "_").replace(/\)/g, "_")
      })
    });

    keys.forEach(timepoint => delete d[timepoint]);

    d['data'].sort((a, b) => a.date - b.date);

    d['placeName'] = metadata.placeName;
    d['province'] = metadata.province;
    const last2 = d.data.slice(-2);
    d['numIncrease'] = (last2[1].cases - last2[0].cases);
    d['pctIncrease'] = d.numIncrease / last2[0].cases;
    d['currentDate'] = last2[1].date;
    d['currentCases'] = last2[1].cases;
  });

  return (data);
}

export function nestEpiTrace(data, nestingVar, nestingType) {
  const formatDate = timeFormat("%m-%d-%y");
  if (data) {
    // nest by date
    const regionNest = nest()
      .key(d => d[nestingVar])
      .key(d => d.date)
      .rollup(values => {
        return ({
          cases: sum(values, d => d.cases),
          countries: map(values, d => d.country).keys(),
          region: values[0].region
        })
      })
      .entries(data);

    regionNest.forEach(d => {
      d['placeName'] = d.key;
      d['id'] = d.key.replace(/\s/g, "_");
      d.values.forEach(timepoint => {
        timepoint['id'] = d.key.replace(/,\s/g, "_").replace(/\s/g, "_").replace(/\(/g, "_").replace(/\)/g, "_");
        timepoint['date'] = isoParse(timepoint.key);
        timepoint['date_string'] = formatDate(timepoint.date);
        timepoint['cases'] = timepoint.value.cases;
      })

      d['data'] = d.values;
      const last2 = d.data.slice(-2);
      d['numIncrease'] = (last2[1].cases - last2[0].cases);
      d['pctIncrease'] = d.numIncrease / last2[0].cases;
      d['currentDate'] = last2[1].date;
      d['currentCases'] = last2[1].cases;
      d['countries'] = d.data[0].value.countries;
      d['region'] = d.data[0].value.region;
      d['locationType'] = nestingType;
    })

    return (regionNest);
  }
}

export function prep4Stacked(data, nestingVar) {
  if (data) {
    // nest by date
    const regionNest = nest()
      .key(d => d[nestingVar])
      .key(d => d.date)
      .rollup(values => sum(values, d => d.cases))
      .entries(data);

    regionNest.map(d => {
      const obj = {};
      obj['date'] = isoParse(d.key);

      d.values.forEach(value => {
        obj[value.key] = value.value;
      })

      return (obj)
    })
  }
}
