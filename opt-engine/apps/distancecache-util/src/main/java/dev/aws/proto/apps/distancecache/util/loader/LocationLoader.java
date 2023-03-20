package dev.aws.proto.apps.distancecache.util.loader;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.CSVParser;
import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.exceptions.CsvException;
import dev.aws.proto.apps.distancecache.util.commands.BuildLatLongCache;
import dev.aws.proto.core.routing.location.Coordinate;
import dev.aws.proto.core.routing.location.CoordinateWithId;
import dev.aws.proto.core.routing.location.ILocation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class LocationLoader {
    private static final Logger logger = LoggerFactory.getLogger(BuildLatLongCache.class);

    public static List<ILocation> loadLocationsFromJsonFile(File locationsFile) throws IOException {
        String locationsFileContent = Files.readString(locationsFile.toPath());

        ObjectMapper objectMapper = new ObjectMapper();
        List<Coordinate> loadedPoints = objectMapper.readValue(locationsFileContent, new TypeReference<List<Coordinate>>() {
        });
        logger.info("loadLocationsFromJsonFile List : {}", loadedPoints);
        List<ILocation> locationList = loadedPoints.stream().map(c -> {
            return new ILocation() {
                @Override
                public String id() {
                    return null;
                }

                @Override
                public Coordinate coordinate() {
                    return c;
                }
            };
        }).collect(Collectors.toList());

        return locationList;
    }

    public static List<ILocation> loadLocationsFromCsvFile(File locationsFile) throws IOException {
        CSVParser csvParser = new CSVParserBuilder().withSeparator(',').build(); // custom separator
        try(CSVReader reader = new CSVReaderBuilder(
                new FileReader(locationsFile))
                .withCSVParser(csvParser)   // custom CSV parser
                .withSkipLines(1)           // skip the first line, header info
                .build()){
            List<String[]> r = reader.readAll();
            logger.info("loadLocationsFromCsvFile List : {}", r);
            List<ILocation> locationList = r.stream().map(x -> {
                //header : DeliveryCode,DeliveryName,Address,Latitude,Longitude
                CoordinateWithId cc = new CoordinateWithId();
                cc.setId(x[0]);
                cc.setLatitude(Double.parseDouble(x[3]));
                cc.setLongitude(Double.parseDouble(x[4]));
                return new ILocation() {
                    @Override
                    public String id() {
                        return x[0];
                    }

                    @Override
                    public Coordinate coordinate() {
                        return cc;
                    }
                };
            }).collect(Collectors.toList());

            return locationList;
        } catch (CsvException e) {
            throw new RuntimeException(e);
        }
    }

    public static List<ILocation> loadLocationsFromDdb(List<Map<String,String>> ls) throws IOException {

            logger.info("loadLocationsFromDdb List : {}", ls);
            List<ILocation> locationList = ls.stream().map(x -> {
                //header : DeliveryCode,DeliveryName,Address,Latitude,Longitude
                CoordinateWithId cc = new CoordinateWithId();
                cc.setId(x.get("deliveryCode"));
                cc.setLatitude(Double.parseDouble(x.get("latitude")));
                cc.setLongitude(Double.parseDouble(x.get("longitude")));
                logger.info("deliveryCode  : {}", x.get("deliveryCode"));
                logger.info("latitude  : {}", Double.parseDouble(x.get("latitude")));
                logger.info("longitude  : {}", Double.parseDouble(x.get("longitude")));

                return new ILocation() {
                    @Override
                    public String id() {
                        return x.get("deliveryCode");
                    }

                    @Override
                    public Coordinate coordinate() {
                        return cc;
                    }
                };
            }).collect(Collectors.toList());

            return locationList;
        }

}
