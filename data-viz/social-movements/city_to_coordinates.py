#!/usr/bin/python
import csv
import sys
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
geolocator = Nominatim()

cache = {}

if (len(sys.argv) < 2 or len(sys.argv) > 3):
    sys.exit("usage: ./city_to_coordinates [infile] [outfile]")

with open(sys.argv[1], 'rb') as data:
    reader = csv.reader(data)
    with open(sys.argv[2], 'wb') as outfile:
        writer = csv.writer(outfile)
        titles = reader.next()
        writer.writerow(["lon", "lat"] + titles)
        for i, header in enumerate(titles):
            if ("City" in header):
                city = i
            elif ("State" in header):
                state = i
        try:
            city
            state
        except NameError:
            sys.exit("Header for city or state not found")
        for row in reader:
            location_name = row[city] + " " + row[state]
            out_row = list(row)
            print(location_name + ":")
            lon_lat = ["Error", "Error"]
            if (location_name in cache):
                lon_lat = cache[location_name]
            else:
                try:
                    location = geolocator.geocode(location_name)
                except GeocoderTimedOut as e:
                    print("Geocoder lookup failed with: " + str(e))
                try:
                    lon_lat = [location.longitude, location.latitude]
                    cache[location_name] = lon_lat
                except AttributeError:
                    print("LatLon not Found")
            out_row = lon_lat + out_row
            print("writing " + str(out_row))
            writer.writerow(out_row)
            
