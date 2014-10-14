#! /usr/bin/env python
# coding=utf-8
from __future__ import unicode_literals

import argparse
import json
import pycountry
import csv


def convertLatLong(file_):
    data = json.load(file_)
    latLongs = {}
    for item in data:
        code = _getCountryCode(item['name']['common'])
        latLongs[code] = item['latlng']
    print json.dumps(latLongs, indent=4)


def convertFlights(file_):
    flights = {}
    reader = csv.DictReader(file_, delimiter=str(','))
    for line in reader:
        depCountry = line['country departure']
        arrCountry = line['country arrival']
        routes = line['number of routes']
        depCode = _getCountryCode(depCountry)
        arrCode = _getCountryCode(arrCountry)
        if arrCode not in flights:
            flights[arrCode] = {}
        flights[arrCode][depCode] = routes
    print json.dumps(flights, indent=4)


def convertAdjacent(file_):
    borders = {}
    data = json.load(file_)
    for country, adjList in data.items():
        code = _getCountryCode(country)
        borders[code] = []
        for adjCountry in adjList:
            adjCode = _getCountryCode(adjCountry)
            borders[code].append(adjCode)
    print json.dumps(borders, indent=4)


def convertEbola(file_):
    cases = {}
    data = json.load(file_)
    for item in data:
        month, day, year = item['Date'].split('/')
        dateString = '%04d%02d%02d' % (int(year), int(month), int(day))
        cases[dateString] = {}
        for key, value in item.items():
            if key != 'Date':
                ''' All non-date entries are countries. '''
                countryName = key
                code = _getCountryCode(countryName)
                cases[dateString][code] = value
    print json.dumps(cases, indent=4)


def convertFlu(file_):
    cases = {}
    reader = csv.DictReader(file_, delimiter=str(','))
    countryNames = reader.fieldnames[1:]
    for line in reader:
        dateString = line['Date'].replace("-", "")
        cases[dateString] = {}
        for name in countryNames:
            code = _getCountryCode(name)
            cases[dateString][code] = int(line[name])
    print json.dumps(cases, indent=4)


def convertLifeExpectancy(file_):
    countries = {}
    data = json.load(file_)
    for country in data:
        name = country['extract']
        expectancy = country['extract1']
        code = _getCountryCode(name)
        countries[code] = expectancy
    print json.dumps(countries, indent=4)


def _getCountryCode(countryName):
    ''' Additional custom lookups for idiosyncratic country names. 
        Most of these were found by looking for closest-name neighbors on Wikipedia at
        http://en.wikipedia.org/wiki/ISO_3166-1_alpha-3. '''
    extraLookups = {
        'South Korea': 'KOR',
        'Taiwan': 'TWN',
        'Brunei ': 'BRN',
        'Brunei': 'BRN',
        'Vietnam': 'VNM',
        'Venezuela': 'VEN',
        'Macedonia': 'MKD',
        'Syria': 'SYR',
        'Iran': 'IRN',
        'Moldova': 'MDA',
        'Russia': 'RUS',
        'Micronesia': 'FSM',
        'North Korea': 'PRK',
        'Bolivia': 'BOL',
        'Laos': 'LAO',
        'Tanzania': 'TZA',
        'Republic of the Congo': 'COG',
        'Guinea Bissau': 'GNB',
        'Democratic Republic of the Congo': 'COD',
        'Sierra_Leone': 'SLE',
        'United_States': 'USA',
        'East Timor': 'TMP',
        'United States of America': 'USA',
        'Ivory Coast': 'CIV',
        'Yugoslavia': 'YUG',
        'St. Lucia': 'LCA',
        'St. Vincent and the Grenadines': 'VCT',
        'Antigua & Barbuda': 'ATG',
        'St. Kitts and Nevis': 'KNA',
        'Burma': 'BUR',
        'Macau': 'MAC',
        'Netherlands Antilles': 'ANT',
        'Virgin Islands': 'VIR',
        'Congo (Kinshasa)': 'COD',
        'Reunion': 'REU',
        'Cote d\'Ivoire': 'CIV',
        'Congo (Brazzaville)': 'COG',
        'British Virgin Islands': 'VGB',
        'Korea': 'PKR',
        'Falkland Islands': 'FLK',
        'Bonaire': 'BES',
        'DR Congo': 'COD',
        'French Southern and Antarctic Lands': 'ATF',
        'Vatican City': 'VAT',
        'Palestine': 'PSE',
        'Pitcairn Islands': 'PCN',
        'Kosovo': 'UNK',
        'Saint Martin': 'MAF',
        'São Tomé and Príncipe': 'STP',
        'Sint Maarten': 'SXM',
        'South Georgia': 'SGS',
        'United States Virgin Islands': 'VIR',
    }
    try:
        code = pycountry.countries.get(name=countryName).alpha3
    except KeyError:
        try: 
            code = extraLookups[countryName]
        except KeyError:
            raise SystemExit("No country code for country: " + countryName)
    return code


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="convert data files to our D3 format")
    parser.add_argument('file', help="Name of file to convert")
    parser.add_argument('mode', help="Conversion mode")
    args = parser.parse_args()
    with open(args.file, 'r') as file_:
        if args.mode == 'le':
            convertLifeExpectancy(file_)
        elif args.mode == 'flu':
            convertFlu(file_)
        elif args.mode == 'ebola':
            convertEbola(file_)
        elif args.mode == 'adj':
            convertAdjacent(file_)
        elif args.mode == 'fl':
            convertFlights(file_)
        elif args.mode == 'lat':
            convertLatLong(file_)
