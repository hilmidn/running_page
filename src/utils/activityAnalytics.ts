/**
 * Activity Analytics Utilities
 * Central hub untuk data processing dari activity streams dan metadata
 */

// Types
export interface Activity {
    run_id: number;
    name: string;
    distance: number; // meters
    moving_time: string;
    type: string;
    subtype: string;
    start_date: string;
    start_date_local: string;
    location_country: string | null;
    summary_polyline: string | null;
    average_heartrate: number | null;
    elevation_gain: number | null;
    average_speed: number; // m/s
    streak: number;
}

export interface ActivityStream {
    id: number;
    heartrate: (number | null)[];
    distance: number[];
    altitude?: (number | null)[];
    cadence?: (number | null)[];
    time: number[];
    latlng: [number, number][];
}

export interface StreamDataValidation {
    hasHR: boolean;
    hasAltitude: boolean;
    hasCadence: boolean;
    hasGPS: boolean;
    dataPoints: number;
}

export interface ChartPoint {
    time: number;
    distance: number;
    distanceKm: number;
    hr?: number;
    altitude?: number;
    cadence?: number;
    pace?: number;
    grade?: number;
}

export interface SegmentStats {
    index: number;
    startDistance: number;
    endDistance: number;
    distanceKm: number;
    startTime: number;
    endTime: number;
    durationSec: number;
    durationFormatted: string;
    avgPace: number; // sec/km
    paceFormatted: string;
    minPace: number;
    maxPace: number;
    paceStdDev: number; // sec/km — sample-level variability inside the split
    avgHR?: number;
    maxHR?: number;
    minHR?: number;
    hrZone?: number;
    elevationGain: number;
    elevationLoss: number;
    avgCadence?: number;
    startLat?: number;
    startLng?: number;
    endLat?: number;
    endLng?: number;
}

export interface CadenceZoneData {
    zone: string; // "Z1", "Z2", etc
    rpmRange: string; // "160-170"
    minRpm: number;
    maxRpm: number;
    timeSeconds: number;
    timeFormatted: string;
    percentage: number;
    avgRpm: number;
    color: string;
}

export interface PaceZoneData {
    zone: string; // "Z1", "Z2", etc
    paceRange: string; // "7:30-8:30/km"
    minPace: number; // sec/km
    maxPace: number; // sec/km
    timeSeconds: number;
    timeFormatted: string;
    percentage: number;
    avgPaceInZone: number;
    formattedAvgPace: string;
    label: string;
    color: string;
}

export interface ElevationProfilePoint {
    distance: number;
    distanceKm: number;
    elevation: number;
    grade: number;
}

export interface LatLng {
    lat: number;
    lng: number;
}

// ============== VALIDATION ==============

/**
 * Validate stream data completeness
 */
export function validateStreamData(stream: ActivityStream): StreamDataValidation {
    const hasHR = !!(stream.heartrate && stream.heartrate.some(hr => hr !== null));
    const hasAltitude = !!(stream.altitude && stream.altitude.some(alt => alt !== null));
    const hasCadence = !!(stream.cadence && stream.cadence.some(c => c !== null));
    const hasGPS = !!(stream.distance && stream.distance.length > 0);
    return {
        hasHR,
        hasAltitude,
        hasCadence,
        hasGPS,
        dataPoints: stream.time?.length || 0,
    };
}

// ============== CONVERSIONS ==============

/**
 * Convert meters to kilometers
 */
export function metersToKm(meters: number): number {
    return meters / 1000;
}

/**
 * Convert seconds to formatted time string (HH:MM:SS)
 */
export function secondsToTimeString(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
            .toString()
            .padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convert seconds to minutes (decimal)
 */
export function secondsToMinutes(seconds: number): number {
    return seconds / 60;
}

/**
 * Format pace from sec/km to MM:SS/km
 */
export function formatPace(secPerKm: number): string {
    if (!isFinite(secPerKm) || secPerKm <= 0) return '--:--';

    const minutes = Math.floor(secPerKm / 60);
    const seconds = Math.floor(secPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate pace (sec/km) from distance and time
 * distance: meters, time: seconds
 */
export function calculatePace(distanceMeters: number, timeSeconds: number): number {
    if (distanceMeters === 0 || timeSeconds === 0) return 0;
    const distanceKm = distanceMeters / 1000;
    return timeSeconds / distanceKm;
}

/**
 * Calculate grade percentage (elevation gain / distance)
 */
export function calculateGrade(elevationGain: number, distanceMeters: number): number {
    if (distanceMeters === 0) return 0;
    return (elevationGain / distanceMeters) * 100;
}

/**
 * Get HR zone (1-5) based on HR percentage of max
 * Strava-like thresholds for running:
 * Z1 Recovery   → < 65%
 * Z2 Endurance  → 65–82%
 * Z3 Aerobic    → 82–89%
 * Z4 Threshold  → 89–97%
 * Z5 VO2 Max    → ≥ 97%
 */
export function getHRZone(hrPercent: number): number {
    if (hrPercent < 65) return 1; // Z1: Recovery
    if (hrPercent < 82) return 2; // Z2: Endurance
    if (hrPercent < 89) return 3; // Z3: Aerobic
    if (hrPercent < 97) return 4; // Z4: Threshold
    return 5; // Z5: VO2 Max
}

/**
 * Get HR zone label
 */
export function getHRZoneLabel(zone: number): string {
    const labels: Record<number, string> = {
        1: 'Recovery',
        2: 'Endurance',
        3: 'Aerobic',
        4: 'Tempo',
        5: 'VO2 Max',
    };
    return labels[zone] || 'Unknown';
}

/**
 * Calculate age from birthdate
 */
export function calculateAge(birthdateString: string): number {
    const birthdate = new Date(birthdateString);
    const today = new Date();

    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDiff = today.getMonth() - birthdate.getMonth();
    const dayDiff = today.getDate() - birthdate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
    }

    return age;
}

// ============== POLYLINE DECODING ==============

/**
 * Decode Google polyline format (used in summary_polyline)
 * Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(polyline: string): LatLng[] {
    const points: LatLng[] = [];
    let lat = 0;
    let lng = 0;
    let index = 0;
    let change = 0;

    while (index < polyline.length) {
        change = 0;
        let shifted = 0;

        let result = 0;
        do {
            result = polyline.charCodeAt(index) - 63 - 1;
            index++;
            result <<= 1;
            if (result & 1) result ^= ~0;
            result >>= 1;
            change += result << shifted;
            shifted += 5;
        } while (result >= 0x1f);

        lat += change;

        change = 0;
        shifted = 0;
        do {
            result = polyline.charCodeAt(index) - 63 - 1;
            index++;
            result <<= 1;
            if (result & 1) result ^= ~0;
            result >>= 1;
            change += result << shifted;
            shifted += 5;
        } while (result >= 0x1f);

        lng += change;

        points.push({
            lat: lat / 1e5,
            lng: lng / 1e5,
        });
    }

    return points;
}

// ============== DATA TRANSFORMATION ==============

/**
 * Transform stream data to chart points
 */
export function formatStreamData(stream: ActivityStream | null | undefined): ChartPoint[] {
    if (!stream || !stream.time) return [];

    const points: ChartPoint[] = [];

    for (let i = 0; i < stream.time.length; i++) {
        const distance = stream.distance?.[i] || 0;
        const time = stream.time[i] || 0;
        const hr = stream.heartrate?.[i];
        const altitude = stream.altitude?.[i];
        const rawCadence = stream.cadence?.[i];
        const cadence = rawCadence != null ? rawCadence * 2 : undefined;

        let pace = 0;
        if (i > 0 && distance > 0 && time > 0) {
            pace = calculatePace(distance, time);
        }

        let grade = 0;
        if (altitude && i > 0 && stream.altitude) {
            const altDiff = altitude - (stream.altitude[i - 1] || altitude);
            grade = calculateGrade(altDiff, distance - (stream.distance[i - 1] || 0));
        }

        points.push({
            time,
            distance,
            distanceKm: metersToKm(distance),
            hr: hr ?? undefined,
            altitude: altitude ?? undefined,
            cadence: cadence ?? undefined,
            pace: pace > 0 ? pace : undefined,
            grade: grade !== 0 ? grade : undefined,
        });
    }

    return points;
}

/**
 * Create elevation profile data for chart
 */
export function createElevationProfileData(
    stream: ActivityStream,
): ElevationProfilePoint[] {
    if (!stream.altitude) return [];

    const points: ElevationProfilePoint[] = [];

    for (let i = 0; i < stream.altitude.length; i++) {
        const altitude = stream.altitude[i];
        if (altitude === null) continue;

        const distance = stream.distance[i] || 0;
        let grade = 0;

        if (i > 0) {
            const prevAltitude = stream.altitude[i - 1] || altitude;
            const prevDistance = stream.distance[i - 1] || 0;
            const altDiff = altitude - prevAltitude;
            const distDiff = distance - prevDistance;
            grade = calculateGrade(altDiff, distDiff);
        }

        points.push({
            distance,
            distanceKm: metersToKm(distance),
            elevation: altitude,
            grade,
        });
    }

    return points;
}

/**
 * Apply smoothing to elevation data (moving average)
 */
export function smoothElevationData(
    data: ElevationProfilePoint[],
    windowSize: number = 5,
): ElevationProfilePoint[] {
    if (data.length < windowSize) return data;

    return data.map((point, index) => {
        const start = Math.max(0, index - Math.floor(windowSize / 2));
        const end = Math.min(data.length, index + Math.floor(windowSize / 2) + 1);
        const subset = data.slice(start, end);

        const avgElevation =
            subset.reduce((sum, p) => sum + p.elevation, 0) / subset.length;
        const avgGrade = subset.reduce((sum, p) => sum + p.grade, 0) / subset.length;

        return {
            ...point,
            elevation: Math.round(avgElevation),
            grade: avgGrade,
        };
    });
}

/**
 * Create cadence zone distribution
 */
export function createCadenceZoneData(
    stream: ActivityStream,
    totalTimeSeconds: number,
): CadenceZoneData[] {
    if (!stream.cadence || totalTimeSeconds === 0) return [];

    const zones = [
        { zone: 'Z1', minRpm: 0, maxRpm: 140, color: '#10b981' }, // Green
        { zone: 'Z2', minRpm: 140, maxRpm: 160, color: '#f59e0b' }, // Yellow
        { zone: 'Z3', minRpm: 160, maxRpm: 180, color: '#f97316' }, // Orange
        { zone: 'Z4', minRpm: 180, maxRpm: 200, color: '#ef4444' }, // Red
        { zone: 'Z5', minRpm: 200, maxRpm: 300, color: '#8b5cf6' }, // Purple
    ];

    const zoneData: CadenceZoneData[] = zones.map(({ zone, minRpm, maxRpm, color }) => {
        let timeInZone = 0;
        let cadenceSum = 0;
        let count = 0;

        for (let i = 0; i < (stream.cadence?.length ?? 0); i++) {
            const raw = stream.cadence?.[i];
            if (raw == null) continue;
            const cadence = raw * 2; // Garmin stores running cadence as ½ SPM
            if (cadence >= minRpm && cadence < maxRpm) {
                timeInZone += 1; // 1 second per data point
                cadenceSum += cadence;
                count++;
            }
        }

        const percentage = (timeInZone / totalTimeSeconds) * 100;
        const avgCadence = count > 0 ? cadenceSum / count : 0;

        return {
            zone,
            rpmRange: `${minRpm}-${maxRpm}`,
            minRpm,
            maxRpm,
            timeSeconds: timeInZone,
            timeFormatted: secondsToTimeString(timeInZone),
            percentage: Math.round(percentage * 10) / 10,
            avgRpm: Math.round(avgCadence),
            color,
        };
    });

    return zoneData;
}

// ============== PACE ZONES ==============

/**
 * Calculate instantaneous pace (sec/km) between consecutive data points
 * Filters out GPS noise and standing-still data (pace > 10:00/km)
 */
function calculateInstantPace(
    stream: ActivityStream,
): { pace: number; valid: boolean }[] {
    const MAX_REASONABLE_PACE = 600; // 10:00/km — above this = GPS noise / stopped
    const paces: { pace: number; valid: boolean }[] = [];

    for (let i = 0; i < stream.time.length; i++) {
        if (i === 0) {
            paces.push({ pace: 0, valid: false });
            continue;
        }

        const distDelta = (stream.distance[i] || 0) - (stream.distance[i - 1] || 0);
        const timeDelta = (stream.time[i] || 0) - (stream.time[i - 1] || 0);

        if (distDelta > 0 && timeDelta > 0) {
            const pace = calculatePace(distDelta, timeDelta);
            if (isFinite(pace) && pace > 0 && pace < MAX_REASONABLE_PACE) {
                paces.push({ pace, valid: true });
                continue;
            }
        }
        paces.push({ pace: 0, valid: false });
    }

    return paces;
}

/**
 * Create pace zone distribution using Strava-style absolute pace thresholds
 * Based on the user's Strava pace zones derived from CP/fitness level
 *
 * All thresholds in seconds per kilometre.
 * Lower sec/km = faster pace, higher sec/km = slower pace.
 *
 * Z1 Recovery   → ≥ 10:12/km (> 612 sec/km, slowest)
 * Z2 Aerobic    → 8:46–10:12/km (526–612)
 * Z3 Tempo      → 7:53–8:46/km  (473–526)
 * Z4 Threshold  → 7:22–7:53/km  (442–473)
 * Z5 VO₂ Max    → 6:56–7:22/km  (416–442)
 * Z6 Anaerobic  → < 6:56/km     (< 416 sec/km, fastest)
 */
export function createPaceZoneData(
    stream: ActivityStream,
    totalTimeSeconds: number,
): PaceZoneData[] {
    if (stream.distance.length === 0 || totalTimeSeconds === 0) return [];

    const paces = calculateInstantPace(stream);
    const validPaces = paces.filter(p => p.valid).map(p => p.pace);

    if (validPaces.length === 0) return [];

    // Absolute pace thresholds (sec/km) matching Strava's running zones for this athlete
    const zones = [
        {
            zone: 'Z1',
            label: 'Recovery',
            minThreshold: 612, // ≥ 10:12/km (slowest)
            maxThreshold: Infinity,
            color: '#10b981',
        },
        {
            zone: 'Z2',
            label: 'Aerobic',
            minThreshold: 526, // 8:46/km
            maxThreshold: 612, // 10:12/km
            color: '#3b82f6',
        },
        {
            zone: 'Z3',
            label: 'Tempo',
            minThreshold: 473, // 7:53/km
            maxThreshold: 526, // 8:46/km
            color: '#f59e0b',
        },
        {
            zone: 'Z4',
            label: 'Threshold',
            minThreshold: 442, // 7:22/km
            maxThreshold: 473, // 7:53/km
            color: '#f97316',
        },
        {
            zone: 'Z5',
            label: 'VO₂ Max',
            minThreshold: 416, // 6:56/km
            maxThreshold: 442, // 7:22/km
            color: '#ef4444',
        },
        {
            zone: 'Z6',
            label: 'Sprint',
            minThreshold: 0,   // fastest
            maxThreshold: 416, // 6:56/km
            color: '#dc2626',
        },
    ];

    const zoneData: PaceZoneData[] = zones.map(
        ({ zone, label, minThreshold, maxThreshold, color }) => {
            let timeInZone = 0;
            let paceSum = 0;
            let count = 0;
            let minPaceInZone = Infinity;
            let maxPaceInZone = 0;

            for (let i = 0; i < paces.length; i++) {
                if (!paces[i].valid) continue;
                const pace = paces[i].pace;

                // Lower sec/km = faster. Z1 is slowest (highest sec/km), Z6 is fastest
                if (pace >= minThreshold && pace < maxThreshold) {
                    timeInZone += 1;
                    paceSum += pace;
                    count++;
                    if (pace < minPaceInZone) minPaceInZone = pace;
                    if (pace > maxPaceInZone) maxPaceInZone = pace;
                }
            }

            const percentage = (timeInZone / totalTimeSeconds) * 100;
            const avgPaceInZoneValue = count > 0 ? paceSum / count : 0;
            const cappedMin = minPaceInZone === Infinity ? minThreshold : minPaceInZone;
            const cappedMax = maxPaceInZone === 0
                ? (maxThreshold === Infinity ? minThreshold + 60 : maxThreshold)
                : maxPaceInZone;

            return {
                zone,
                label,
                paceRange: `${formatPace(cappedMax)}–${formatPace(cappedMin)}/km`,
                minPace: cappedMin,
                maxPace: cappedMax,
                timeSeconds: timeInZone,
                timeFormatted: secondsToTimeString(timeInZone),
                percentage: Math.round(percentage * 10) / 10,
                avgPaceInZone: Math.round(avgPaceInZoneValue),
                formattedAvgPace: formatPace(avgPaceInZoneValue),
                color,
            };
        },
    );

    return zoneData;
}

// ============== SEGMENTS/SPLITS ==============

/**
 * Split activity into segments by distance (e.g., 1km splits)
 */
/**
 * Split activity into segments by distance (e.g., 1km splits)
 */
export function splitActivityByDistance(
    stream: ActivityStream,
    segmentDistanceMeters: number = 1000, // 1km default
): SegmentStats[] {
    if (stream.distance.length === 0) return [];

    const segments: SegmentStats[] = [];

    let segmentIndex = 0;
    let currentSegmentStart = 0;

    for (let i = 0; i < stream.distance.length; i++) {
        const distance = stream.distance[i];

        if (distance >= (segmentIndex + 1) * segmentDistanceMeters) {
            const stats = calculateSegmentStats(stream, currentSegmentStart, i, segmentIndex);
            if (stats) {
                segments.push(stats);
            }
            currentSegmentStart = i;
            segmentIndex++;
        }
    }

    // Add final segment
    if (currentSegmentStart < stream.distance.length - 1) {
        const stats = calculateSegmentStats(
            stream,
            currentSegmentStart,
            stream.distance.length - 1,
            segmentIndex,
        );
        if (stats) {
            segments.push(stats);
        }
    }

    return segments;
}

/**
 * Split activity into segments by time (e.g., 1min splits)
 */
export function splitActivityByTime(
    stream: ActivityStream,
    segmentTimeSeconds: number = 60, // 1min default
): SegmentStats[] {
    if (stream.time.length === 0) return [];

    const segments: SegmentStats[] = [];
    let segmentIndex = 0;
    let currentSegmentStart = 0;

    for (let i = 0; i < stream.time.length; i++) {
        const time = stream.time[i];

        if (time >= (segmentIndex + 1) * segmentTimeSeconds) {
            const stats = calculateSegmentStats(stream, currentSegmentStart, i, segmentIndex);
            if (stats) {
                segments.push(stats);
            }
            currentSegmentStart = i;
            segmentIndex++;
        }
    }

    // Add final segment
    if (currentSegmentStart < stream.time.length - 1) {
        const stats = calculateSegmentStats(
            stream,
            currentSegmentStart,
            stream.time.length - 1,
            segmentIndex,
        );
        if (stats) {
            segments.push(stats);
        }
    }

    return segments;
}

/**
 * Calculate stats for a segment (between two indices)
 */
export function calculateSegmentStats(
    stream: ActivityStream,
    startIdx: number,
    endIdx: number,
    index: number,
): SegmentStats | null {
    if (startIdx >= endIdx || startIdx < 0 || endIdx >= stream.distance.length) {
        return null;
    }

    const startDistance = stream.distance[startIdx] || 0;
    const endDistance = stream.distance[endIdx] || 0;
    const distanceKm = metersToKm(endDistance - startDistance);

    const startTime = stream.time[startIdx] || 0;
    const endTime = stream.time[endIdx] || 0;
    const durationSec = endTime - startTime;

    const avgPace = calculatePace(endDistance - startDistance, durationSec);

    // HR stats
    let avgHR: number | undefined;
    let maxHR: number | undefined;
    let minHR: number | undefined;
    let hrZone: number | undefined;

    const hrValues = stream.heartrate
        ?.slice(startIdx, endIdx + 1)
        .filter(hr => hr !== null) as number[];

    if (hrValues && hrValues.length > 0) {
        avgHR = Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length);
        maxHR = Math.max(...hrValues);
        minHR = Math.min(...hrValues);

        // Estimate HR zone (assuming max HR = 220 - age, simplified)
        const estimatedMaxHR = 180; // default approximation
        const hrPercent = (avgHR / estimatedMaxHR) * 100;
        hrZone = getHRZone(hrPercent);
    }

    // Elevation stats
    let elevationGain = 0;
    let elevationLoss = 0;

    if (stream.altitude) {
        for (let i = startIdx + 1; i <= endIdx; i++) {
            const prevAlt = stream.altitude[i - 1];
            const currAlt = stream.altitude[i];

            if (prevAlt !== null && currAlt !== null) {
                const diff = currAlt - prevAlt;
                if (diff > 0) {
                    elevationGain += diff;
                } else {
                    elevationLoss += Math.abs(diff);
                }
            }
        }
    }

    // Cadence stats
    let avgCadence: number | undefined;

    if (stream.cadence) {
        const cadenceValues = stream.cadence
            ?.slice(startIdx, endIdx + 1)
            .filter(c => c !== null)
            .map(c => c * 2); // Garmin stores running cadence as ½ SPM

        if (cadenceValues && cadenceValues.length > 0) {
            avgCadence = Math.round(
                cadenceValues.reduce((a, b) => a + b, 0) / cadenceValues.length,
            );
        }
    }

    // Pace stats
    let minPace = avgPace;
    let maxPace = avgPace;
    const subPaces: number[] = [];

    for (let i = startIdx; i < endIdx; i++) {
        const segDist = (stream.distance[i + 1] || 0) - (stream.distance[i] || 0);
        const segTime = (stream.time[i + 1] || 0) - (stream.time[i] || 0);
        if (segDist > 0 && segTime > 0) {
            const pace = calculatePace(segDist, segTime);
            if (pace > 0 && isFinite(pace)) {
                minPace = Math.min(minPace, pace);
                maxPace = Math.max(maxPace, pace);
                subPaces.push(pace);
            }
        }
    }

    // Pace variability — sample-level standard deviation. Useful for
    // spotting late-run fatigue in tempo workouts.
    let paceStdDev = 0;
    if (subPaces.length >= 4) {
        const mean = subPaces.reduce((a, b) => a + b, 0) / subPaces.length;
        const variance =
            subPaces.reduce((sum, p) => sum + (p - mean) * (p - mean), 0) /
            subPaces.length;
        paceStdDev = Math.sqrt(variance);
    }

    return {
        index,
        startDistance,
        endDistance,
        distanceKm,
        startTime,
        endTime,
        durationSec,
        durationFormatted: secondsToTimeString(durationSec),
        avgPace,
        paceFormatted: formatPace(avgPace),
        minPace,
        maxPace,
        paceStdDev,
        avgHR,
        maxHR,
        minHR,
        hrZone,
        elevationGain: Math.round(elevationGain),
        elevationLoss: Math.round(elevationLoss),
        avgCadence,
    };
}

/**
 * Calculate overall HR zones distribution
 */
export function calculateHRZoneDistribution(
    stream: ActivityStream,
    maxHR: number = 180,
): Record<number, { timeSeconds: number; percentage: number }> {
    if (!stream.heartrate) {
        return {
            1: { timeSeconds: 0, percentage: 0 },
            2: { timeSeconds: 0, percentage: 0 },
            3: { timeSeconds: 0, percentage: 0 },
            4: { timeSeconds: 0, percentage: 0 },
            5: { timeSeconds: 0, percentage: 0 },
        };
    }

    const totalTime = stream.time[stream.time.length - 1] || 0;
    const zoneTime: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (let i = 0; i < stream.heartrate.length; i++) {
        const hr = stream.heartrate[i];
        if (hr === null) continue;

        const hrPercent = (hr / maxHR) * 100;
        const zone = getHRZone(hrPercent);
        zoneTime[zone] += 1; // 1 second per data point
    }

    const result: Record<number, { timeSeconds: number; percentage: number }> = {};
    for (let zone = 1; zone <= 5; zone++) {
        const percentage = totalTime > 0 ? (zoneTime[zone] / totalTime) * 100 : 0;
        result[zone] = {
            timeSeconds: zoneTime[zone],
            percentage: Math.round(percentage * 10) / 10,
        };
    }

    return result;
}

// ============== CARDIAC DRIFT ==============

/**
 * Cardiac drift / Aerobic Decoupling analysis.
 *
 * Splits the activity into two equal halves by distance, then compares the
 * Efficiency Factor (EF = speed / avg HR) between halves.
 *
 *   Aerobic Decoupling % = ((EF_first - EF_second) / EF_first) × 100
 *
 * - Decoupling < 5%  → excellent aerobic base, stable cardiovascular efficiency
 * - 5–10%            → good (typical for moderate efforts)
 * - 10–15%           → fair (room to grow aerobic base)
 * - > 15%            → poor (cardiac drift suggests aerobic deficit or fatigue)
 *
 * Requires a stream of at least `minDistanceKm` to be meaningful — short
 * intervals skew the comparison because the warm-up dominates the first half.
 */
export type CardiacDriftStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'na';

export interface CardiacDriftHalf {
    distanceKm: number;
    durationSec: number;
    durationFormatted: string;
    avgPace: number; // sec/km
    paceFormatted: string;
    avgHR: number; // bpm
    efficiencyFactor: number; // speed (m/s) / avg HR
}

export interface CardiacDriftData {
    available: boolean;
    reason?: string; // populated when available=false
    firstHalf: CardiacDriftHalf | null;
    secondHalf: CardiacDriftHalf | null;
    decoupling: number; // percentage (positive = drift, negative = improving)
    status: CardiacDriftStatus;
    label: string;
    message: string;
}

export function calculateCardiacDrift(
    stream: ActivityStream,
    maxHR: number = 180,
    minDistanceKm: number = 2,
): CardiacDriftData {
    const empty: CardiacDriftData = {
        available: false,
        firstHalf: null,
        secondHalf: null,
        decoupling: 0,
        status: 'na',
        label: 'N/A',
        message: '',
    };

    if (!stream.heartrate || stream.heartrate.length === 0) {
        return {
            ...empty,
            reason: 'No heart rate data in this activity.',
        };
    }
    if (!stream.distance || stream.distance.length === 0) {
        return { ...empty, reason: 'No distance data in this activity.' };
    }

    const totalDistance = stream.distance[stream.distance.length - 1] || 0;
    if (totalDistance < minDistanceKm * 1000) {
        return {
            ...empty,
            reason: `Activity is shorter than ${minDistanceKm} km — drift analysis not meaningful.`,
        };
    }

    // Find the index closest to the distance midpoint
    const midpoint = totalDistance / 2;
    let midIdx = stream.distance.length - 1;
    for (let i = 0; i < stream.distance.length; i++) {
        if (stream.distance[i] >= midpoint) {
            midIdx = i;
            break;
        }
    }

    const computeHalf = (
        start: number,
        end: number,
    ): CardiacDriftHalf | null => {
        if (end <= start) return null;
        const distMeters =
            (stream.distance[end] || 0) - (stream.distance[start] || 0);
        const durationSec =
            (stream.time[end] || 0) - (stream.time[start] || 0);
        const hrValues = stream.heartrate
            .slice(start, end + 1)
            .filter((hr): hr is number => hr !== null && hr > 0);

        if (hrValues.length === 0 || distMeters <= 0 || durationSec <= 0) {
            return null;
        }

        const avgHR = hrValues.reduce((a, b) => a + b, 0) / hrValues.length;
        const speed = distMeters / durationSec; // m/s
        const efficiencyFactor = speed / avgHR;
        const avgPace = calculatePace(distMeters, durationSec);

        return {
            distanceKm: metersToKm(distMeters),
            durationSec,
            durationFormatted: secondsToTimeString(durationSec),
            avgPace,
            paceFormatted: formatPace(avgPace),
            avgHR: Math.round(avgHR),
            efficiencyFactor,
        };
    };

    const firstHalf = computeHalf(0, midIdx);
    const secondHalf = computeHalf(midIdx, stream.distance.length - 1);

    if (!firstHalf || !secondHalf || firstHalf.efficiencyFactor === 0) {
        return {
            ...empty,
            reason: 'Not enough HR samples in one of the halves.',
        };
    }

    const decoupling =
        ((firstHalf.efficiencyFactor - secondHalf.efficiencyFactor) /
            firstHalf.efficiencyFactor) *
        100;

    let status: CardiacDriftStatus;
    let label: string;
    let message: string;

    if (decoupling < 0) {
        status = 'excellent';
        label = 'Improving';
        message =
            'Efficiency improved through the run — strong cardiovascular control.';
    } else if (decoupling < 5) {
        status = 'excellent';
        label = 'Excellent';
        message = 'Cardiac drift is minimal. Strong aerobic base.';
    } else if (decoupling < 10) {
        status = 'good';
        label = 'Good';
        message = 'Mild drift — typical for steady aerobic efforts.';
    } else if (decoupling < 15) {
        status = 'fair';
        label = 'Fair';
        message = 'Noticeable drift. More aerobic volume will help.';
    } else {
        status = 'poor';
        label = 'Needs Work';
        message =
            'High drift — aerobic base still developing, or fatigue was a factor.';
    }

    return {
        available: true,
        firstHalf,
        secondHalf,
        decoupling,
        status,
        label,
        message,
    };
}

/**
 * Color for cardiac drift status (Tailwind-friendly hex).
 */
export function getDriftColor(status: CardiacDriftStatus): string {
    switch (status) {
        case 'excellent':
            return '#10b981'; // emerald-500
        case 'good':
            return '#3b82f6'; // blue-500
        case 'fair':
            return '#f59e0b'; // amber-500
        case 'poor':
            return '#ef4444'; // red-500
        default:
            return '#6b7280'; // gray-500
    }
}

// ============== VO2MAX ESTIMATE ==============

export type VO2maxGrade =
    | 'elite'
    | 'excellent'
    | 'good'
    | 'fair'
    | 'beginner'
    | 'na';

export interface VO2maxEstimate {
    available: boolean;
    reason?: string;
    /** From overall activity average speed — Daniels/Gilbert formula. */
    fromAverage: number;
    /** From the best rolling 5-min sustained effort (race-fitness proxy). */
    fromBestEffort: number | null;
    bestEffortSpeed: number | null; // m/s — used for the rolling window
    bestEffortTimeWindow: { startSec: number; endSec: number } | null;
    grade: VO2maxGrade;
    label: string;
    message: string;
}

/**
 * Estimate VO2max from a running activity.
 *
 * Uses the Daniels/Gilbert formula:
 *   VO2 = -4.60 + 0.182258 * v + 0.000104 * v²   (v in m/min)
 *
 * Two estimates are returned:
 *   1. **From average** — uses the overall activity average speed. Best
 *      when the entire run is at a single steady effort (e.g. a tempo run
 *      or time trial). Underestimates fitness if the run has easy
 *      warm-up / cooldown mixed in.
 *   2. **From best 5-min effort** — scans the stream for the fastest
 *      sustained 5-minute rolling window. This is the better race-fitness
 *      proxy because it isolates the hardest effort from warm-up and
 *      recovery sections.
 *
 * Grade bands (Daniels' VDOT rough guide for trained adult males):
 *   - < 40   → beginner
 *   - 40–50  → fair
 *   - 50–60  → good
 *   - 60–70  → excellent
 *   - ≥ 70   → elite
 */
export function estimateVO2max(
    stream: ActivityStream,
    fallbackAvgSpeedMps?: number,
): VO2maxEstimate {
    const empty: VO2maxEstimate = {
        available: false,
        fromAverage: 0,
        fromBestEffort: null,
        bestEffortSpeed: null,
        bestEffortTimeWindow: null,
        grade: 'na',
        label: 'N/A',
        message: '',
    };

    if (!stream.distance || stream.distance.length < 2) {
        return { ...empty, reason: 'No distance data in this activity.' };
    }
    if (!stream.time || stream.time.length < 2) {
        return { ...empty, reason: 'No time data in this activity.' };
    }

    const totalDist = stream.distance[stream.distance.length - 1] || 0;
    const totalTime = stream.time[stream.time.length - 1] || 0;
    if (totalDist <= 0 || totalTime <= 0) {
        return { ...empty, reason: 'Activity has zero distance/time.' };
    }

    const avgSpeedMps = totalDist / totalTime;
    const fromAverage = vo2FromSpeed(avgSpeedMps);

    // Best rolling 5-min effort. We need a stream long enough that the
    // window is actually meaningful — at least 5 minutes of running.
    let bestEffortSpeed: number | null = null;
    let bestStart = 0;
    let bestEnd = 0;
    const windowSec = 300; // 5 minutes

    if (totalTime >= windowSec) {
        let j = 0;
        for (let i = 0; i < stream.time.length; i++) {
            const tStart = stream.time[i] || 0;
            // advance j until t[j] is at least windowSec after tStart
            while (
                j < stream.time.length &&
                (stream.time[j] || 0) - tStart < windowSec
            ) {
                j++;
            }
            if (j >= stream.time.length) break;
            const tEnd = stream.time[j] || 0;
            const dStart = stream.distance[i] || 0;
            const dEnd = stream.distance[j] || 0;
            const distM = dEnd - dStart;
            const dt = tEnd - tStart;
            if (distM > 0 && dt >= windowSec - 5) {
                const speed = distM / dt;
                if (bestEffortSpeed == null || speed > bestEffortSpeed) {
                    bestEffortSpeed = speed;
                    bestStart = tStart;
                    bestEnd = tEnd;
                }
            }
        }
    }

    const fromBestEffort =
        bestEffortSpeed != null ? vo2FromSpeed(bestEffortSpeed) : null;

    // Grade the best-effort number (more representative), fall back to avg.
    const primary = fromBestEffort ?? fromAverage;
    const { grade, label, message } = gradeVO2max(primary);

    return {
        available: true,
        fromAverage,
        fromBestEffort,
        bestEffortSpeed,
        bestEffortTimeWindow:
            bestEffortSpeed != null
                ? { startSec: bestStart, endSec: bestEnd }
                : null,
        grade,
        label,
        message,
    };
}

function vo2FromSpeed(speedMps: number): number {
    if (speedMps <= 0) return 0;
    const v = speedMps * 60; // m/min
    return -4.6 + 0.182258 * v + 0.000104 * v * v;
}

function gradeVO2max(value: number): {
    grade: VO2maxGrade;
    label: string;
    message: string;
} {
    if (value <= 0) {
        return {
            grade: 'na',
            label: 'N/A',
            message: 'Not enough data to estimate VO2max.',
        };
    }
    if (value >= 70) {
        return {
            grade: 'elite',
            label: 'Elite',
            message: 'Elite-level aerobic capacity. Top-tier runner.',
        };
    }
    if (value >= 60) {
        return {
            grade: 'excellent',
            label: 'Excellent',
            message: 'Excellent aerobic capacity. Strong racing potential.',
        };
    }
    if (value >= 50) {
        return {
            grade: 'good',
            label: 'Good',
            message: 'Good aerobic fitness. Solid base for half-marathon training.',
        };
    }
    if (value >= 40) {
        return {
            grade: 'fair',
            label: 'Fair',
            message: 'Decent fitness — consistent easy mileage will keep moving it up.',
        };
    }
    return {
        grade: 'beginner',
        label: 'Beginner',
        message:
            'Plenty of headroom. Easy-zone volume and patience will pay off.',
    };
}

export function getVO2maxColor(grade: VO2maxGrade): string {
    switch (grade) {
        case 'elite':
            return '#a855f7'; // purple-500
        case 'excellent':
            return '#10b981'; // emerald-500
        case 'good':
            return '#3b82f6'; // blue-500
        case 'fair':
            return '#f59e0b'; // amber-500
        case 'beginner':
            return '#6b7280'; // gray-500
        default:
            return '#6b7280';
    }
}

// ============== GRADE-ADJUSTED PACE & ELEVATION ZONES ==============

/**
 * Minetti cost-of-running coefficients (1998) — energy cost per kg per
 * meter as a 5th-degree polynomial in grade (gradient as decimal, e.g.
 * 0.05 = +5% uphill, -0.10 = -10% downhill).
 *
 *   C(g) = 155.4 g⁵ - 30.4 g⁴ - 43.3 g³ + 46.3 g² + 19.5 g + 3.6
 *
 * On the flat (g=0): 3.6 J/kg/m, which is the canonical reference.
 *
 * We use the inverse of the cost ratio to translate actual pace into a
 * flat-equivalent Grade-Adjusted Pace (GAP):
 *
 *   GAP_pace = actual_pace * (C(g) / C(0)) = actual_pace * (C(g) / 3.6)
 *
 * - Uphill (g > 0) → C > 3.6 → GAP_pace higher (slower flat equivalent) ✓
 * - Downhill (g < 0, modest) → C < 3.6 → GAP_pace lower (faster flat equivalent) ✓
 * - Steep downhill (g < -0.2) → C rises again, model becomes more punitive
 */
export function minettiCostPerKgPerMeter(grade: number): number {
    const g = grade;
    return (
        155.4 * g ** 5 -
        30.4 * g ** 4 -
        43.3 * g ** 3 +
        46.3 * g ** 2 +
        19.5 * g +
        3.6
    );
}

const FLAT_COST = 3.6; // J/kg/m at g=0

export type GradeBand = 'steep_up' | 'up' | 'flat' | 'down' | 'steep_down';

export interface GradeBandDef {
    band: GradeBand;
    label: string;
    minGrade: number; // inclusive lower bound (decimal)
    maxGrade: number; // exclusive upper bound
    color: string;
}

export const GRADE_BANDS: GradeBandDef[] = [
    { band: 'steep_up', label: 'Steep up', minGrade: 0.04, maxGrade: 1, color: '#dc2626' },
    { band: 'up', label: 'Uphill', minGrade: 0.02, maxGrade: 0.04, color: '#f59e0b' },
    { band: 'flat', label: 'Flat', minGrade: -0.02, maxGrade: 0.02, color: '#3b82f6' },
    { band: 'down', label: 'Downhill', minGrade: -0.04, maxGrade: -0.02, color: '#10b981' },
    { band: 'steep_down', label: 'Steep down', minGrade: -1, maxGrade: -0.04, color: '#059669' },
];

export function gradeBandFor(grade: number): GradeBand {
    if (grade >= 0.04) return 'steep_up';
    if (grade >= 0.02) return 'up';
    if (grade >= -0.02) return 'flat';
    if (grade >= -0.04) return 'down';
    return 'steep_down';
}

export interface ElevationZoneStats {
    band: GradeBand;
    label: string;
    color: string;
    distanceMeters: number;
    durationSec: number;
    durationFormatted: string;
    percentage: number; // 0..100, by distance
}

export interface ElevationAnalysis {
    available: boolean;
    reason?: string;
    hasAltitude: boolean;
    totalElevationGain: number; // m
    totalElevationLoss: number; // m
    avgGrade: number; // decimal, weighted by distance
    actualAvgPace: number; // sec/km
    gapAvgPace: number; // sec/km — flat-equivalent
    gapPaceFormatted: string;
    actualPaceFormatted: string;
    paceDelta: number; // sec/km, positive = uphill cost / negative = downhill benefit
    zones: ElevationZoneStats[];
    hillDifficulty: 'flat' | 'easy' | 'moderate' | 'challenging' | 'brutal';
    hillScore: number; // simple composite score
    hillMessage: string;
}

const FLAT_BAND_DIST_THRESHOLD = 10; // m — ignore sub-10m samples (GPS noise)
const MIN_DISTANCE_FOR_GAP = 0.3; // km — too short → GAP meaningless

/**
 * Per-sample GAP pace series (for charting) and zone breakdown.
 *
 * Grade is computed between consecutive stream points using altitude and
 * horizontal distance. We do not use total distance (which would dilute
 * vertical gain) — only the horizontal projection:
 *   horizDist = sqrt(totalDist² - elevDelta²)
 *   grade     = elevDelta / horizDist
 */
export function calculateElevationAnalysis(
    stream: ActivityStream,
): ElevationAnalysis {
    const empty: ElevationAnalysis = {
        available: false,
        reason: '',
        hasAltitude: false,
        totalElevationGain: 0,
        totalElevationLoss: 0,
        avgGrade: 0,
        actualAvgPace: 0,
        gapAvgPace: 0,
        gapPaceFormatted: '',
        actualPaceFormatted: '',
        paceDelta: 0,
        zones: [],
        hillDifficulty: 'flat',
        hillScore: 0,
        hillMessage: '',
    };

    if (!stream.distance || stream.distance.length < 2) {
        return { ...empty, reason: 'No distance data in this activity.' };
    }
    if (!stream.time || stream.time.length < 2) {
        return { ...empty, reason: 'No time data in this activity.' };
    }

    const totalDist = stream.distance[stream.distance.length - 1] || 0;
    if (totalDist < MIN_DISTANCE_FOR_GAP * 1000) {
        return {
            ...empty,
            reason: `Activity is shorter than ${MIN_DISTANCE_FOR_GAP} km — GAP analysis not meaningful.`,
        };
    }

    const hasAltitude =
        !!stream.altitude && stream.altitude.some((a) => a != null);
    if (!hasAltitude) {
        return {
            ...empty,
            reason:
                'No altitude stream — cannot compute grade-adjusted pace. (Connect a GPS watch with barometric altimeter for hill analysis.)',
            hasAltitude: false,
        };
    }

    const len = Math.min(
        stream.distance.length,
        stream.time.length,
        stream.altitude!.length,
    );

    let elevGain = 0;
    let elevLoss = 0;
    let gradeWeightedByHorizDist = 0;
    let totalHorizDist = 0;

    // Zone accumulators
    const zoneAcc: Record<
        GradeBand,
        { distance: number; duration: number }
    > = {
        steep_up: { distance: 0, duration: 0 },
        up: { distance: 0, duration: 0 },
        flat: { distance: 0, duration: 0 },
        down: { distance: 0, duration: 0 },
        steep_down: { distance: 0, duration: 0 },
    };

    let gapDistWeighted = 0; // sum(pace_gap * dist) → divide by total → GAP pace
    let actualDistWeighted = 0;

    for (let i = 0; i < len - 1; i++) {
        const dStart = stream.distance[i] || 0;
        const dEnd = stream.distance[i + 1] || 0;
        const tStart = stream.time[i] || 0;
        const tEnd = stream.time[i + 1] || 0;
        const aStart = stream.altitude![i];
        const aEnd = stream.altitude![i + 1];

        const totalStep = dEnd - dStart;
        const dt = tEnd - tStart;
        if (totalStep <= 0 || dt <= 0) continue;
        if (totalStep < 0.5) continue; // sub-half-metre samples are noise

        if (aStart == null || aEnd == null) continue;
        const elevDelta = aEnd - aStart;
        const horizDist = Math.sqrt(
            Math.max(0, totalStep * totalStep - elevDelta * elevDelta),
        );
        if (horizDist < FLAT_BAND_DIST_THRESHOLD / 1000) continue;

        const grade = elevDelta / horizDist;
        // Clamp pathological grades (GPS noise can produce huge values on
        // tiny vertical wiggles). Real-world running tops out around ±30%.
        const clampedGrade = Math.max(-0.5, Math.min(0.5, grade));

        if (elevDelta > 0) elevGain += elevDelta;
        else elevLoss += -elevDelta;

        gradeWeightedByHorizDist += clampedGrade * horizDist;
        totalHorizDist += horizDist;

        const band = gradeBandFor(clampedGrade);
        zoneAcc[band].distance += horizDist;
        zoneAcc[band].duration += dt;

        const actualPace = (dt / horizDist) * 1000; // sec/km
        const cost = minettiCostPerKgPerMeter(clampedGrade);
        const gapPace = actualPace * (cost / FLAT_COST);

        gapDistWeighted += gapPace * horizDist;
        actualDistWeighted += actualPace * horizDist;
    }

    if (totalHorizDist <= 0) {
        return {
            ...empty,
            reason:
                'Could not derive grade samples — altitude stream may be flat-lined or too coarse.',
            hasAltitude: true,
        };
    }

    const avgGrade = gradeWeightedByHorizDist / totalHorizDist;
    const actualAvgPace = actualDistWeighted / totalHorizDist;
    const gapAvgPace = gapDistWeighted / totalHorizDist;

    const zones: ElevationZoneStats[] = GRADE_BANDS.map((b) => {
        const acc = zoneAcc[b.band];
        return {
            band: b.band,
            label: b.label,
            color: b.color,
            distanceMeters: acc.distance,
            durationSec: acc.duration,
            durationFormatted: secondsToTimeString(acc.duration),
            percentage:
                totalHorizDist > 0 ? (acc.distance / totalHorizDist) * 100 : 0,
        };
    });

    // Hill difficulty — composite of elevation gain per km and avg grade.
    // Score: (elev_gain_m / dist_km) * 10 + |avg_grade_pct| * 2
    //   0     → flat
    //   <15   → easy
    //   <35   → moderate
    //   <60   → challenging
    //   ≥60   → brutal
    const distKm = totalHorizDist / 1000;
    const elevGainPerKm = elevGain / distKm;
    const hillScore = elevGainPerKm * 10 + Math.abs(avgGrade) * 100 * 2;

    let hillDifficulty: ElevationAnalysis['hillDifficulty'];
    let hillMessage: string;
    if (hillScore < 5) {
        hillDifficulty = 'flat';
        hillMessage = 'Flat course. Pure pace comparison.';
    } else if (hillScore < 15) {
        hillDifficulty = 'easy';
        hillMessage = 'Mild rolling terrain. Negligible hill cost.';
    } else if (hillScore < 35) {
        hillDifficulty = 'moderate';
        hillMessage = 'Moderate hills. Use GAP to compare efforts across runs.';
    } else if (hillScore < 60) {
        hillDifficulty = 'challenging';
        hillMessage = 'Challenging hills. Strong leg strength required.';
    } else {
        hillDifficulty = 'brutal';
        hillMessage = 'Brutal climbing. Trail-runner territory.';
    }

    return {
        available: true,
        hasAltitude: true,
        totalElevationGain: Math.round(elevGain),
        totalElevationLoss: Math.round(elevLoss),
        avgGrade,
        actualAvgPace,
        gapAvgPace,
        gapPaceFormatted: formatPace(gapAvgPace),
        actualPaceFormatted: formatPace(actualAvgPace),
        paceDelta: gapAvgPace - actualAvgPace,
        zones,
        hillDifficulty,
        hillScore,
        hillMessage,
    };
}

// ============== CADENCE-PACE CORRELATION ==============

export interface CadencePacePoint {
    cadence: number; // spm
    pace: number; // sec/km
    distanceKm: number;
    hr?: number;
}

export interface CadencePaceScatterData {
    available: boolean;
    reason?: string;
    points: CadencePacePoint[];
    regression: {
        slope: number; // sec/km per spm
        intercept: number; // sec/km
        pearsonR: number; // -1..1 (typically negative — higher cadence = lower sec/km = faster)
        rSquared: number; // 0..1
        lineStart: { cadence: number; pace: number };
        lineEnd: { cadence: number; pace: number };
    } | null;
    sampleCount: number;
    cadenceRange: { min: number; max: number };
    paceRange: { min: number; max: number };
}

/**
 * Build a cadence vs pace scatter from the stream. Filters out warm-up,
 * non-running samples, and obviously broken readings so the regression
 * isn't dragged around by outliers.
 */
export function createCadencePaceScatterData(
    stream: ActivityStream,
    options: {
        sampleStride?: number; // take every Nth point to keep payload small
        skipFirstSeconds?: number; // skip warm-up
        skipLastSeconds?: number; // skip cooldown
        maxPoints?: number;
    } = {},
): CadencePaceScatterData {
    const {
        sampleStride = 5,
        skipFirstSeconds = 60,
        skipLastSeconds = 30,
        maxPoints = 800,
    } = options;

    const empty: CadencePaceScatterData = {
        available: false,
        points: [],
        regression: null,
        sampleCount: 0,
        cadenceRange: { min: 0, max: 0 },
        paceRange: { min: 0, max: 0 },
    };

    if (!stream.cadence || stream.cadence.length === 0) {
        return { ...empty, reason: 'No cadence data in this activity.' };
    }
    if (!stream.distance || stream.distance.length === 0) {
        return { ...empty, reason: 'No distance data in this activity.' };
    }

    const totalTime = stream.time[stream.time.length - 1] || 0;
    if (totalTime < 180) {
        return {
            ...empty,
            reason: 'Activity is too short for correlation analysis.',
        };
    }

    const points: CadencePacePoint[] = [];
    const len = Math.min(
        stream.cadence.length,
        stream.distance.length,
        stream.time.length,
    );

    for (let i = 0; i < len; i++) {
        const t = stream.time[i] || 0;
        if (t < skipFirstSeconds) continue;
        if (t > totalTime - skipLastSeconds) continue;

        const cadence = stream.cadence[i];
        if (cadence == null || cadence <= 0) continue;

        // Garmin stores running cadence as ½ SPM — mirror the convention
        // used in calculateSegmentStats so the chart matches the splits table.
        const cadenceSpm = cadence * 2;

        // Derive pace at this point using the next sample's distance/time.
        if (i >= len - 1) continue;
        const dDelta = (stream.distance[i + 1] || 0) - stream.distance[i];
        const tDelta = (stream.time[i + 1] || 0) - stream.time[i];
        if (dDelta <= 0 || tDelta <= 0) continue;

        const pace = (tDelta / dDelta) * 1000; // sec/km
        if (!isFinite(pace) || pace <= 0 || pace > 1800) continue; // >30 min/km = noise

        if (i % sampleStride !== 0) continue;

        const hr = stream.heartrate?.[i];
        points.push({
            cadence: cadenceSpm,
            pace,
            distanceKm: (stream.distance[i] || 0) / 1000,
            hr: hr == null ? undefined : hr,
        });
    }

    if (points.length < 8) {
        return {
            ...empty,
            reason: 'Not enough valid cadence/pace samples to correlate.',
        };
    }

    // Downsample if still too many points
    let sampled = points;
    if (points.length > maxPoints) {
        const step = Math.ceil(points.length / maxPoints);
        sampled = points.filter((_, idx) => idx % step === 0);
    }

    // Linear regression (least squares)
    const n = sampled.length;
    const sumX = sampled.reduce((s, p) => s + p.cadence, 0);
    const sumY = sampled.reduce((s, p) => s + p.pace, 0);
    const sumXY = sampled.reduce((s, p) => s + p.cadence * p.pace, 0);
    const sumX2 = sampled.reduce((s, p) => s + p.cadence * p.cadence, 0);
    const sumY2 = sampled.reduce((s, p) => s + p.pace * p.pace, 0);

    const meanX = sumX / n;
    const meanY = sumY / n;
    const denomX = sumX2 - n * meanX * meanX;
    const denomY = sumY2 - n * meanY * meanY;
    const denomXY = sumX2 - n * meanX * meanX;

    let slope = 0;
    let intercept = meanY;
    let pearsonR = 0;

    if (denomX > 0 && denomY > 0) {
        slope = (sumXY - n * meanX * meanY) / denomX;
        intercept = meanY - slope * meanX;
        const numR = sumXY - n * meanX * meanY;
        const denR = Math.sqrt(denomX * denomY);
        pearsonR = denR === 0 ? 0 : numR / denR;
    } else if (denomXY > 0) {
        slope = (sumXY - n * meanX * meanY) / denomXY;
        intercept = meanY - slope * meanX;
    }

    const rSquared = pearsonR * pearsonR;

    const cadences = sampled.map((p) => p.cadence);
    const paces = sampled.map((p) => p.pace);
    const cadenceRange = {
        min: Math.min(...cadences),
        max: Math.max(...cadences),
    };
    const paceRange = {
        min: Math.min(...paces),
        max: Math.max(...paces),
    };

    // Clamp regression line to observed cadence range so it draws cleanly
    const xStart = cadenceRange.min;
    const xEnd = cadenceRange.max;
    const lineStart = { cadence: xStart, pace: slope * xStart + intercept };
    const lineEnd = { cadence: xEnd, pace: slope * xEnd + intercept };

    return {
        available: true,
        points: sampled,
        regression: {
            slope,
            intercept,
            pearsonR,
            rSquared,
            lineStart,
            lineEnd,
        },
        sampleCount: points.length,
        cadenceRange,
        paceRange,
    };
}

// ============== HEART RATE RECOVERY ==============

export type HRRecoveryGrade = 'excellent' | 'good' | 'fair' | 'poor' | 'na';

export interface HRRecoveryData {
    available: boolean;
    reason?: string;
    peakHR: number; // bpm
    peakTimeSec: number; // seconds from start
    peakDistanceKm: number;
    hrr1: number | null; // bpm drop after 60s
    hrr2: number | null; // bpm drop after 120s
    hrr3: number | null; // bpm drop after 180s
    pct1: number | null; // % drop after 60s
    pct2: number | null;
    pct3: number | null;
    grade: HRRecoveryGrade;
    label: string;
    message: string;
}

/**
 * Heart Rate Recovery analysis.
 *
 * Finds the peak HR sample in the stream and measures the drop at 60, 120
 * and 180 seconds after that peak. HRR-1 (1-minute drop) is the most
 * clinically meaningful single number — well-studied thresholds:
 *
 *   - HRR-1 ≥ 18 bpm  → excellent cardiovascular fitness
 *   - HRR-1 12–17     → good
 *   - HRR-1 6–11      → fair
 *   - HRR-1 < 6       → poor (worth a check-up)
 *
 * Requires at least 3 minutes of HR samples after the peak to surface
 * the 1/2/3-min metrics — short runs are hidden gracefully.
 */
export function calculateHRRecovery(stream: ActivityStream): HRRecoveryData {
    const empty: HRRecoveryData = {
        available: false,
        peakHR: 0,
        peakTimeSec: 0,
        peakDistanceKm: 0,
        hrr1: null,
        hrr2: null,
        hrr3: null,
        pct1: null,
        pct2: null,
        pct3: null,
        grade: 'na',
        label: 'N/A',
        message: '',
    };

    if (!stream.heartrate || stream.heartrate.length === 0) {
        return { ...empty, reason: 'No heart rate data in this activity.' };
    }

    // Find peak HR (ignoring nulls and zeros)
    let peakIdx = -1;
    let peakVal = 0;
    for (let i = 0; i < stream.heartrate.length; i++) {
        const hr = stream.heartrate[i];
        if (hr == null || hr <= 0) continue;
        if (hr > peakVal) {
            peakVal = hr;
            peakIdx = i;
        }
    }

    if (peakIdx < 0) {
        return { ...empty, reason: 'No valid HR samples found.' };
    }

    const peakHR = peakVal;
    const peakTimeSec = stream.time[peakIdx] || 0;
    const peakDistanceKm = (stream.distance?.[peakIdx] || 0) / 1000;

    const totalTime = stream.time[stream.time.length - 1] || 0;
    if (totalTime - peakTimeSec < 60) {
        return {
            ...empty,
            reason:
                'Peak HR was too close to the end of the run — no recovery window to measure.',
            peakHR,
            peakTimeSec,
            peakDistanceKm,
            hrr1: null,
            hrr2: null,
            hrr3: null,
            pct1: null,
            pct2: null,
            pct3: null,
            grade: 'na',
            label: 'N/A',
            message: '',
        };
    }

    /**
     * For each target offset (seconds), find the HR sample closest to
     * `peakTimeSec + offset` and return its HR.
     */
    const sampleAtOffset = (offsetSec: number): number | null => {
        if (peakTimeSec + offsetSec > totalTime) return null;
        const target = peakTimeSec + offsetSec;
        // Linear scan is fine — heartrate stream is usually <10k points
        let bestIdx = peakIdx;
        let bestDelta = Infinity;
        for (let i = peakIdx; i < stream.heartrate.length; i++) {
            const t = stream.time[i] || 0;
            if (t < target) continue;
            const d = t - target;
            if (d < bestDelta) {
                bestDelta = d;
                bestIdx = i;
            } else {
                break; // time is monotonically increasing
            }
        }
        const hr = stream.heartrate[bestIdx];
        if (hr == null || hr <= 0) return null;
        return hr;
    };

    const hr60 = sampleAtOffset(60);
    const hr120 = sampleAtOffset(120);
    const hr180 = sampleAtOffset(180);

    const hrr1 = hr60 != null ? peakHR - hr60 : null;
    const hrr2 = hr120 != null ? peakHR - hr120 : null;
    const hrr3 = hr180 != null ? peakHR - hr180 : null;
    const pct1 = hrr1 != null ? (hrr1 / peakHR) * 100 : null;
    const pct2 = hrr2 != null ? (hrr2 / peakHR) * 100 : null;
    const pct3 = hrr3 != null ? (hrr3 / peakHR) * 100 : null;

    // Grade on HRR-1
    let grade: HRRecoveryGrade;
    let label: string;
    let message: string;

    if (hrr1 == null) {
        grade = 'na';
        label = 'N/A';
        message = 'No 1-minute recovery sample available.';
    } else if (hrr1 < 0) {
        // HR went up after the supposed peak — likely mid-workout, not end-of-effort
        grade = 'fair';
        label = 'Inconclusive';
        message =
            'HR continued to climb after the peak — no clean recovery window.';
    } else if (hrr1 >= 18) {
        grade = 'excellent';
        label = 'Excellent';
        message = 'Strong cardiovascular recovery. Aerobic base is solid.';
    } else if (hrr1 >= 12) {
        grade = 'good';
        label = 'Good';
        message = 'Healthy recovery response — typical for trained runners.';
    } else if (hrr1 >= 6) {
        grade = 'fair';
        label = 'Fair';
        message = 'Modest recovery — more aerobic work will help.';
    } else {
        grade = 'poor';
        label = 'Poor';
        message =
            'Slow recovery. Worth flagging if persistent — check sleep, stress, and easy-run volume.';
    }

    return {
        available: true,
        peakHR,
        peakTimeSec,
        peakDistanceKm,
        hrr1,
        hrr2,
        hrr3,
        pct1,
        pct2,
        pct3,
        grade,
        label,
        message,
    };
}

/**
 * Color for HR recovery grade.
 */
export function getHRRecoveryColor(grade: HRRecoveryGrade): string {
    switch (grade) {
        case 'excellent':
            return '#10b981';
        case 'good':
            return '#3b82f6';
        case 'fair':
            return '#f59e0b';
        case 'poor':
            return '#ef4444';
        default:
            return '#6b7280';
    }
}

// ============== FORMATTING ==============

/**
 * Format distance for display (m, km)
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
}

/**
 * Format speed (m/s) to km/h
 */
export function formatSpeed(mPerS: number): string {
    return `${(mPerS * 3.6).toFixed(1)}km/h`;
}

/**
 * Get color for pace value
 */
export function getPaceColor(pace: number, avgPace: number): string {
    if (pace < avgPace * 0.9) return '#10b981'; // Green - Fast
    if (pace < avgPace) return '#60a5fa'; // Blue - Good
    if (pace < avgPace * 1.1) return '#f59e0b'; // Yellow - Normal
    return '#ef4444'; // Red - Slow
}

/**
 * Get color for HR zone
 */
export function getZoneColor(zone: number): string {
    const colors: Record<number, string> = {
        1: '#10b981', // Green - Z1 Recovery
        2: '#3b82f6', // Blue - Z2 Endurance
        3: '#f59e0b', // Yellow - Z3 Aerobic
        4: '#f97316', // Orange - Z4 Tempo
        5: '#ef4444', // Red - Z5 VO2 Max
    };
    return colors[zone] || '#6b7280';
}

// ============== PERSONAL BESTS & RACE PREDICTIONS ==============

export interface PBCandidate {
    /** Human-readable label, e.g. "1K", "1 mile", "5K". */
    label: string;
    /** Distance in meters. */
    distanceMeters: number;
    /** Time in seconds the runner held this distance, fastest effort. */
    timeSec: number | null;
    /** Average pace in sec/km. */
    paceSecPerKm: number | null;
    /** Stream index range [start, end] (inclusive) where this effort lives. */
    startIdx: number | null;
    endIdx: number | null;
    /**
     * True if the run is long enough to *contain* this distance; false if
     * the candidate is too short to be assessed (we won't make a
     * prediction from a 3-km run).
     */
    achievable: boolean;
}

/**
 * Find fastest sustained efforts for a few standard distances inside a
 * single activity. We use a sliding window and track the smallest
 * (distance / elapsed) ratio — i.e. the fastest sustained cover.
 *
 * Only distances that fit *inside* the run are returned as achievable.
 * Predictions for longer races are then derived from the best achievable
 * segment (see `predictRaceTimes`).
 */
export function findPersonalBests(stream: ActivityStream): PBCandidate[] {
    const candidates: { label: string; distance: number }[] = [
        { label: '1K', distance: 1000 },
        { label: '1 mile', distance: 1609.34 },
        { label: '5K', distance: 5000 },
        { label: '10K', distance: 10000 },
    ];

    const totalDist =
        (stream.distance && stream.distance[stream.distance.length - 1]) || 0;

    if (!stream.distance || !stream.time || stream.distance.length < 2) {
        return candidates.map((c) => ({
            label: c.label,
            distanceMeters: c.distance,
            timeSec: null,
            paceSecPerKm: null,
            startIdx: null,
            endIdx: null,
            achievable: false,
        }));
    }

    return candidates.map((c) => {
        const achievable = totalDist >= c.distance;
        if (!achievable) {
            return {
                label: c.label,
                distanceMeters: c.distance,
                timeSec: null,
                paceSecPerKm: null,
                startIdx: null,
                endIdx: null,
                achievable: false,
            };
        }

        // Sliding window: for each i, find largest j such that
        // stream.distance[j] - stream.distance[i] >= c.distance.
        // We want minimum (time[j] - time[i]) over all i where the
        // window is at least c.distance wide.
        let bestTime = Infinity;
        let bestStart = -1;
        let bestEnd = -1;
        let j = 0;
        for (let i = 0; i < stream.distance.length; i++) {
            const dStart = stream.distance[i] || 0;
            while (
                j < stream.distance.length &&
                (stream.distance[j] || 0) - dStart < c.distance
            ) {
                j++;
            }
            if (j >= stream.distance.length) break;
            const tStart = stream.time[i] || 0;
            const tEnd = stream.time[j] || 0;
            const elapsed = tEnd - tStart;
            // Allow a tiny tolerance for floating-point or sampling drift
            const actualDist = (stream.distance[j] || 0) - dStart;
            if (actualDist < c.distance * 0.998) continue;
            if (elapsed > 0 && elapsed < bestTime) {
                bestTime = elapsed;
                bestStart = i;
                bestEnd = j;
            }
        }

        if (bestTime === Infinity) {
            return {
                label: c.label,
                distanceMeters: c.distance,
                timeSec: null,
                paceSecPerKm: null,
                startIdx: null,
                endIdx: null,
                achievable: false,
            };
        }

        return {
            label: c.label,
            distanceMeters: c.distance,
            timeSec: bestTime,
            paceSecPerKm: (bestTime / c.distance) * 1000,
            startIdx: bestStart,
            endIdx: bestEnd,
            achievable: true,
        };
    });
}

export interface RacePrediction {
    label: string;
    distanceMeters: number;
    timeSec: number; // predicted, in seconds
    paceSecPerKm: number;
}

/**
 * Riegel's race-time formula:   T₂ = T₁ × (D₂ / D₁)^1.06
 *
 * Picks the longest *achieved* PR as the basis (longer efforts are
 * more reliable predictors than short ones) and predicts every other
 * common distance from it. Output is sorted by distance ascending.
 *
 * The exponent 1.06 is Riegel's 1977 value — slightly more conservative
 * than the 1.07 used by some calculators, which biases predictions
 * slightly *faster* for short distances. 1.06 is closer to the
 * "expected reality" for trained amateur runners.
 */
export function predictRaceTimes(pbs: PBCandidate[]): RacePrediction[] {
    const targetDistances: { label: string; meters: number }[] = [
        { label: '1K', meters: 1000 },
        { label: '1 mile', meters: 1609.34 },
        { label: '5K', meters: 5000 },
        { label: '10K', meters: 10000 },
        { label: 'Half Marathon', meters: 21097.5 },
        { label: 'Marathon', meters: 42195 },
    ];

    // Pick the longest achievable PR — strongest signal.
    const achievable = pbs.filter((p) => p.achievable && p.timeSec != null);
    if (achievable.length === 0) return [];
    const basis = achievable.reduce((a, b) =>
        (a.distanceMeters || 0) >= (b.distanceMeters || 0) ? a : b,
    );

    const T1 = basis.timeSec!;
    const D1 = basis.distanceMeters;

    return targetDistances
        .map((t) => {
            const T2 = T1 * Math.pow(t.meters / D1, 1.06);
            return {
                label: t.label,
                distanceMeters: t.meters,
                timeSec: T2,
                paceSecPerKm: (T2 / t.meters) * 1000,
            };
        })
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

// ============== WORKOUT CLASSIFIER ==============

export type WorkoutType =
    | 'recovery'
    | 'easy'
    | 'long'
    | 'tempo'
    | 'threshold'
    | 'intervals'
    | 'race'
    | 'unclassified';

export interface WorkoutClassification {
    type: WorkoutType;
    label: string;
    color: string;
    message: string;
    /** 0–1, how confident the classifier is in the call. */
    confidence: number;
    /** Concrete numbers that drove the decision. */
    signals: {
        durationMin: number;
        avgPaceSecPerKm: number | null;
        avgHRPercent: number | null;
        paceVariability: number | null; // coefficient of variation
    };
}

const WORKOUT_META: Record<
    WorkoutType,
    { label: string; color: string; message: string }
> = {
    recovery: {
        label: 'Recovery',
        color: '#10b981',
        message: 'Easy-effort shake-out. Short, low HR — perfect for active recovery.',
    },
    easy: {
        label: 'Easy Run',
        color: '#3b82f6',
        message: 'Conversational pace in Z2. The bread-and-butter of aerobic base.',
    },
    long: {
        label: 'Long Run',
        color: '#0ea5e9',
        message: 'Extended duration at conversational pace. Builds endurance and fat oxidation.',
    },
    tempo: {
        label: 'Tempo Run',
        color: '#f59e0b',
        message: 'Sustained comfortably-hard effort (Z3-Z4). Lactate-threshold builder.',
    },
    threshold: {
        label: 'Threshold',
        color: '#f97316',
        message: 'Right at lactate threshold (~Z4). Specific endurance work.',
    },
    intervals: {
        label: 'Intervals',
        color: '#ef4444',
        message: 'Repeated high-intensity bursts. VO2max and speed endurance.',
    },
    race: {
        label: 'Race Effort',
        color: '#a855f7',
        message: 'All-out sustained effort. Treat as a benchmark, not a regular workout.',
    },
    unclassified: {
        label: 'Unclassified',
        color: '#6b7280',
        message: 'Mixed signals — could be a workout with multiple phases.',
    },
};

/**
 * Heuristic workout classifier. Looks at:
 *   - duration
 *   - average pace
 *   - average HR (as % of max)
 *   - pace variability (high variability = intervals, low = steady)
 *
 * The decision tree is intentionally simple. Edge cases fall through to
 * "unclassified" with a hint about why.
 */
export function classifyWorkout(
    stream: ActivityStream,
    maxHR: number = 180,
): WorkoutClassification {
    const emptySignals = {
        durationMin: 0,
        avgPaceSecPerKm: null as number | null,
        avgHRPercent: null as number | null,
        paceVariability: null as number | null,
    };
    if (!stream.distance || !stream.time || stream.distance.length < 2) {
        return {
            type: 'unclassified',
            ...WORKOUT_META.unclassified,
            confidence: 0,
            signals: emptySignals,
        };
    }

    const totalDist = stream.distance[stream.distance.length - 1] || 0;
    const totalTime = stream.time[stream.time.length - 1] || 0;
    if (totalDist <= 0 || totalTime <= 0) {
        return {
            type: 'unclassified',
            ...WORKOUT_META.unclassified,
            confidence: 0,
            signals: emptySignals,
        };
    }
    const durationMin = totalTime / 60;
    const avgPace = (totalTime / totalDist) * 1000;

    // Average HR
    let hrSum = 0;
    let hrCount = 0;
    if (stream.heartrate) {
        for (const hr of stream.heartrate) {
            if (hr != null) {
                hrSum += hr;
                hrCount++;
            }
        }
    }
    const avgHRPercent = hrCount > 0 ? (hrSum / hrCount / maxHR) * 100 : null;

    // Pace variability: coefficient of variation over per-sample paces
    const samplePaces: number[] = [];
    for (let i = 0; i < stream.distance.length - 1; i++) {
        const d = (stream.distance[i + 1] || 0) - (stream.distance[i] || 0);
        const t = (stream.time[i + 1] || 0) - (stream.time[i] || 0);
        if (d > 0.5 && t > 0) {
            const p = (t / d) * 1000;
            if (p > 60 && p < 1800) samplePaces.push(p);
        }
    }
    let paceVariability: number | null = null;
    if (samplePaces.length >= 4) {
        const mean =
            samplePaces.reduce((a, b) => a + b, 0) / samplePaces.length;
        const variance =
            samplePaces.reduce((s, p) => s + (p - mean) * (p - mean), 0) /
            samplePaces.length;
        const stdDev = Math.sqrt(variance);
        paceVariability = mean > 0 ? (stdDev / mean) * 100 : null;
    }

    const signals = {
        durationMin,
        avgPaceSecPerKm: avgPace,
        avgHRPercent,
        paceVariability,
    };

    // Decision tree
    if (durationMin < 25 && (avgHRPercent == null || avgHRPercent < 75)) {
        return {
            type: 'recovery',
            ...WORKOUT_META.recovery,
            confidence: 0.7,
            signals,
        };
    }

    if (paceVariability != null && paceVariability > 18 && durationMin < 75) {
        // High pace variability in a moderate-length run → intervals/fartlek
        return {
            type: 'intervals',
            ...WORKOUT_META.intervals,
            confidence: 0.75,
            signals,
        };
    }

    if (avgHRPercent != null && avgHRPercent >= 92) {
        // Sustained near-max effort
        if (durationMin < 50) {
            return {
                type: 'race',
                ...WORKOUT_META.race,
                confidence: 0.7,
                signals,
            };
        }
        return {
            type: 'threshold',
            ...WORKOUT_META.threshold,
            confidence: 0.65,
            signals,
        };
    }

    if (avgHRPercent != null && avgHRPercent >= 84) {
        return {
            type: 'tempo',
            ...WORKOUT_META.tempo,
            confidence: 0.7,
            signals,
        };
    }

    if (durationMin >= 90 && (avgHRPercent == null || avgHRPercent < 78)) {
        return {
            type: 'long',
            ...WORKOUT_META.long,
            confidence: 0.7,
            signals,
        };
    }

    if (avgHRPercent != null && avgHRPercent >= 78 && durationMin < 60) {
        return {
            type: 'tempo',
            ...WORKOUT_META.tempo,
            confidence: 0.55,
            signals,
        };
    }

    if (avgHRPercent != null && avgHRPercent < 78) {
        return {
            type: 'easy',
            ...WORKOUT_META.easy,
            confidence: 0.6,
            signals,
        };
    }

    return {
        type: 'unclassified',
        ...WORKOUT_META.unclassified,
        confidence: 0.2,
        signals,
    };
}

// ============== TRAINING LOAD (TRIMP) ==============

export type TrainingLoadBand =
    | 'recovery'
    | 'light'
    | 'moderate'
    | 'hard'
    | 'very_hard';

export interface TrainingLoadData {
    available: boolean;
    reason?: string;
    trimp: number; // Banister TRIMP score
    avgHR: number | null;
    maxHRUsed: number;
    restHRUsed: number;
    durationMin: number;
    band: TrainingLoadBand;
    bandLabel: string;
    bandColor: string;
    message: string;
    /** Approximate recovery hours until next hard session (very rough). */
    recoveryHours: number;
}

const TRIMP_BANDS: Record<
    TrainingLoadBand,
    { label: string; color: string; min: number; recoveryHrs: number }
> = {
    recovery: {
        label: 'Recovery',
        color: '#10b981',
        min: 0,
        recoveryHrs: 8,
    },
    light: { label: 'Light', color: '#3b82f6', min: 50, recoveryHrs: 18 },
    moderate: { label: 'Moderate', color: '#f59e0b', min: 100, recoveryHrs: 28 },
    hard: { label: 'Hard', color: '#f97316', min: 200, recoveryHrs: 42 },
    very_hard: { label: 'Very Hard', color: '#ef4444', min: 300, recoveryHrs: 60 },
};

/**
 * Banister TRIMP (Training Impulse) — single-activity training load.
 *
 *   TRIMP = D × HR_ratio × exp(b × HR_ratio)
 *   HR_ratio = (avg_HR − rest_HR) / (max_HR − rest_HR)
 *
 * b = 1.92 for males, 1.67 for females. We default to 1.92 (the more
 * common reference) — could be lifted to a user pref later.
 *
 * Rough band guides (for a trained amateur runner, single session):
 *   <50   recovery   (active recovery / shake-out)
 *   50–100 light     (easy / short run)
 *   100–200 moderate (long run / steady aerobic)
 *   200–300 hard     (tempo / threshold session)
 *   300+   very hard (long race / big interval day)
 *
 * Limitations: this is *just* the single-activity TRIMP. Real CTL/ATL
 * (chronic / acute training load) needs a windowed view across many
 * activities — out of scope for the single-activity page.
 */
export function calculateTRIMP(
    stream: ActivityStream,
    maxHR: number = 180,
    restHR: number = 60,
): TrainingLoadData {
    if (!stream.heartrate || stream.heartrate.length === 0) {
        return {
            available: false,
            reason: 'No heart rate data — TRIMP requires HR stream.',
            trimp: 0,
            avgHR: null,
            maxHRUsed: maxHR,
            restHRUsed: restHR,
            durationMin: 0,
            band: 'recovery',
            bandLabel: 'N/A',
            bandColor: '#6b7280',
            message: '',
            recoveryHours: 0,
        };
    }
    if (maxHR <= restHR) {
        return {
            available: false,
            reason: 'maxHR must be greater than restHR to compute TRIMP.',
            trimp: 0,
            avgHR: null,
            maxHRUsed: maxHR,
            restHRUsed: restHR,
            durationMin: 0,
            band: 'recovery',
            bandLabel: 'N/A',
            bandColor: '#6b7280',
            message: '',
            recoveryHours: 0,
        };
    }

    const totalTime = stream.time[stream.time.length - 1] || 0;
    const durationMin = totalTime / 60;
    if (durationMin < 1) {
        return {
            available: false,
            reason: 'Run is too short to compute meaningful TRIMP.',
            trimp: 0,
            avgHR: null,
            maxHRUsed: maxHR,
            restHRUsed: restHR,
            durationMin,
            band: 'recovery',
            bandLabel: 'N/A',
            bandColor: '#6b7280',
            message: '',
            recoveryHours: 0,
        };
    }

    let hrSum = 0;
    let hrCount = 0;
    for (const hr of stream.heartrate) {
        if (hr != null) {
            hrSum += hr;
            hrCount++;
        }
    }
    if (hrCount === 0) {
        return {
            available: false,
            reason: 'All HR samples are null.',
            trimp: 0,
            avgHR: null,
            maxHRUsed: maxHR,
            restHRUsed: restHR,
            durationMin,
            band: 'recovery',
            bandLabel: 'N/A',
            bandColor: '#6b7280',
            message: '',
            recoveryHours: 0,
        };
    }
    const avgHR = hrSum / hrCount;
    const hrRatio = (avgHR - restHR) / (maxHR - restHR);
    const clampedRatio = Math.max(0, Math.min(1.4, hrRatio));
    const b = 1.92;
    const trimp = durationMin * clampedRatio * Math.exp(b * clampedRatio);

    let band: TrainingLoadBand = 'recovery';
    if (trimp >= 300) band = 'very_hard';
    else if (trimp >= 200) band = 'hard';
    else if (trimp >= 100) band = 'moderate';
    else if (trimp >= 50) band = 'light';
    const meta = TRIMP_BANDS[band];

    const message =
        band === 'very_hard'
          ? 'Significant load — schedule a full rest day before the next hard session.'
          : band === 'hard'
            ? 'Hard session — easy day tomorrow is recommended.'
            : band === 'moderate'
              ? 'Solid aerobic load. Fits into a normal training week.'
              : band === 'light'
                ? 'Light aerobic work. Counts toward weekly volume but not stressful.'
                : 'Recovery-level effort. Easy to recover from.';

    return {
        available: true,
        trimp: Math.round(trimp),
        avgHR: Math.round(avgHR),
        maxHRUsed: maxHR,
        restHRUsed: restHR,
        durationMin,
        band,
        bandLabel: meta.label,
        bandColor: meta.color,
        message,
        recoveryHours: meta.recoveryHrs,
    };
}

// ============== NEGATIVE SPLIT DETECTION ==============

export type SplitPattern = 'negative' | 'even' | 'positive' | 'unclassified';

export interface SplitHalf {
    label: string;
    distanceKm: number;
    durationSec: number;
    durationFormatted: string;
    avgPace: number; // sec/km
    paceFormatted: string;
    avgHR: number | null;
}
export interface SplitAnalysis {
    available: boolean;
    reason?: string;
    firstHalf: SplitHalf | null;
    secondHalf: SplitHalf | null;
    paceDelta: number; // sec/km — positive = slowed down (positive split), negative = sped up (negative split)
    paceDeltaPct: number; // percentage — negative = negative split
    pattern: SplitPattern;
    label: string;
    color: string;
    message: string;
    /** True when the 2nd half is ≥2% faster than the 1st. */
    isNegative: boolean;
}

const NEGATIVE_SPLIT_THRESHOLD_PCT = 2; // ≥2% faster in 2nd half
const POSITIVE_SPLIT_THRESHOLD_PCT = 2; // ≥2% slower in 2nd half

/**
 * Detects whether the run was a negative, even, or positive split.
 * Splits the activity into 2 equal halves by distance, then compares
 * average pace of each half.
 *
 * Negative splits (2nd half faster) are the gold standard for races:
 * you start conservatively and finish strong, sparing glycogen for the
 * back end. Positive splits (slowing down) usually mean going out too
 * hard or fading.
 */
export function detectNegativeSplit(
    stream: ActivityStream,
): SplitAnalysis {
    if (!stream.distance || !stream.time || stream.distance.length < 2) {
        return {
            available: false,
            reason: 'No distance/time stream.',
            firstHalf: null,
            secondHalf: null,
            paceDelta: 0,
            paceDeltaPct: 0,
            pattern: 'unclassified',
            label: 'N/A',
            color: '#6b7280',
            message: '',
            isNegative: false,
        };
    }
    const totalDist = stream.distance[stream.distance.length - 1] || 0;
    if (totalDist < 2000) {
        return {
            available: false,
            reason: 'Run is shorter than 2 km — splits are not meaningful.',
            firstHalf: null,
            secondHalf: null,
            paceDelta: 0,
            paceDeltaPct: 0,
            pattern: 'unclassified',
            label: 'N/A',
            color: '#6b7280',
            message: '',
            isNegative: false,
        };
    }
    const halfDist = totalDist / 2;

    const findIdx = (target: number): number => {
        for (let i = 0; i < stream.distance.length; i++) {
            if ((stream.distance[i] || 0) >= target) return i;
        }
        return stream.distance.length - 1;
    };
    const midIdx = findIdx(halfDist);

    const halfFromTo = (startIdx: number, endIdx: number, label: string): SplitHalf => {
        const dStart = stream.distance[startIdx] || 0;
        const dEnd = stream.distance[endIdx] || 0;
        const tStart = stream.time[startIdx] || 0;
        const tEnd = stream.time[endIdx] || 0;
        const dist = dEnd - dStart;
        const dur = tEnd - tStart;
        const pace = dist > 0 && dur > 0 ? (dur / dist) * 1000 : 0;
        let hrSum = 0;
        let hrCount = 0;
        if (stream.heartrate) {
            for (let i = startIdx; i <= endIdx; i++) {
                const hr = stream.heartrate[i];
                if (hr != null) {
                    hrSum += hr;
                    hrCount++;
                }
            }
        }
        return {
            label,
            distanceKm: dist / 1000,
            durationSec: dur,
            durationFormatted: secondsToTimeString(dur),
            avgPace: pace,
            paceFormatted: formatPace(pace),
            avgHR: hrCount > 0 ? Math.round(hrSum / hrCount) : null,
        };
    };

    const first = halfFromTo(0, midIdx, '1st half');
    const second = halfFromTo(midIdx, stream.distance.length - 1, '2nd half');
    const paceDelta = second.avgPace - first.avgPace; // +ve = slowed, -ve = sped up
    const paceDeltaPct =
        first.avgPace > 0 ? (paceDelta / first.avgPace) * 100 : 0;

    let pattern: SplitPattern;
    let label: string;
    let color: string;
    let message: string;
    if (paceDeltaPct <= -NEGATIVE_SPLIT_THRESHOLD_PCT) {
        pattern = 'negative';
        label = 'Negative Split';
        color = '#10b981';
        message = `2nd half was ${Math.abs(paceDeltaPct).toFixed(1)}% faster than the 1st — textbook pacing. Spares glycogen for the finish.`;
    } else if (
        paceDeltaPct >= POSITIVE_SPLIT_THRESHOLD_PCT
    ) {
        pattern = 'positive';
        label = 'Positive Split';
        color = '#f59e0b';
        message = `2nd half was ${paceDeltaPct.toFixed(1)}% slower than the 1st — typical fading pattern. Consider a more conservative start next time.`;
    } else if (paceDeltaPct < 0) {
        pattern = 'negative';
        label = 'Slight Negative';
        color = '#10b981';
        message = `Slight negative bias (${Math.abs(paceDeltaPct).toFixed(1)}% faster in 2nd half). Almost even — very controlled pacing.`;
    } else {
        pattern = 'even';
        label = 'Even Split';
        color = '#3b82f6';
        message = `2nd half pace matched the 1st (Δ ${paceDeltaPct.toFixed(1)}%). Steady, controlled effort.`;
    }

    return {
        available: true,
        firstHalf: first,
        secondHalf: second,
        paceDelta,
        paceDeltaPct,
        pattern,
        label,
        color,
        message,
        isNegative: pattern === 'negative',
    };
}

// ============== STRIDE LENGTH ANALYSIS ==============

export interface StrideSample {
    distanceM: number; // horizontal meters over this sample
    durationSec: number;
    cadenceSpm: number; // true SPM (already doubled if Garmin)
    paceSecPerKm: number;
    strideLengthM: number;
}

export interface StrideAnalysis {
    available: boolean;
    reason?: string;
    samples: number;
    avgStrideLengthM: number;
    minStrideLengthM: number;
    maxStrideLengthM: number;
    strideVariabilityPct: number; // coefficient of variation
    /** Sample-level correlation between pace and stride length. */
    paceStrideCorrelation: number | null;
    /** Slopes from linear regression (stride gain per 1 sec/km faster). */
    stridePerPaceSec: number | null; // m per (sec/km) — positive
    message: string;
}

/**
 * Per-sample stride length = horizontal_distance / steps, where
 *   steps = (cadence_spm / 60) * duration_sec
 *
 * Cadence is converted from the half-SPM Garmin convention to true SPM
 * inside the loop. Stride is only meaningful when running, so we filter
 * out:
 *   - very slow samples (pace > 12 min/km, i.e. walking / standing)
 *   - very low cadence (pauses)
 *   - sub-half-metre samples (GPS noise)
 */
export function analyzeStrideLength(stream: ActivityStream): StrideAnalysis {
    const empty: StrideAnalysis = {
        available: false,
        reason: '',
        samples: 0,
        avgStrideLengthM: 0,
        minStrideLengthM: 0,
        maxStrideLengthM: 0,
        strideVariabilityPct: 0,
        paceStrideCorrelation: null,
        stridePerPaceSec: null,
        message: '',
    };

    if (!stream.cadence || stream.cadence.length === 0) {
        return {
            ...empty,
            reason: 'No cadence data — stride length requires a cadence stream.',
        };
    }
    if (!stream.distance || !stream.time || stream.distance.length < 2) {
        return { ...empty, reason: 'No distance/time stream.' };
    }

    const len = Math.min(
        stream.distance.length,
        stream.time.length,
        stream.cadence.length,
    );

    const samples: StrideSample[] = [];
    for (let i = 0; i < len - 1; i++) {
        const d = (stream.distance[i + 1] || 0) - (stream.distance[i] || 0);
        const t = (stream.time[i + 1] || 0) - (stream.time[i] || 0);
        const rawCadence = stream.cadence[i];
        if (rawCadence == null) continue;
        if (d < 0.5 || t <= 0) continue;

        const cadenceSpm = rawCadence * 2; // Garmin half-SPM → SPM
        if (cadenceSpm < 130) continue; // walking or pause
        if (cadenceSpm > 220) continue; // clearly invalid

        const pace = (t / d) * 1000;
        if (pace < 180 || pace > 720) continue; // 3:00 – 12:00/km
        if (pace > 600) continue; // exclude walking

        const steps = (cadenceSpm / 60) * t;
        if (steps <= 0) continue;
        const stride = d / steps;
        if (stride < 0.4 || stride > 3.5) continue; // sanity bounds

        samples.push({
            distanceM: d,
            durationSec: t,
            cadenceSpm,
            paceSecPerKm: pace,
            strideLengthM: stride,
        });
    }

    if (samples.length < 4) {
        return {
            ...empty,
            reason: `Only ${samples.length} valid stride samples — need at least 4 for an analysis.`,
        };
    }

    const strides = samples.map((s) => s.strideLengthM);
    const avg = strides.reduce((a, b) => a + b, 0) / strides.length;
    const min = Math.min(...strides);
    const max = Math.max(...strides);
    const variance =
        strides.reduce((sum, s) => sum + (s - avg) * (s - avg), 0) /
        strides.length;
    const stdDev = Math.sqrt(variance);
    const variabilityPct = avg > 0 ? (stdDev / avg) * 100 : 0;

    // Pearson correlation between pace and stride
    let correlation: number | null = null;
    let slope: number | null = null;
    {
        const xs = samples.map((s) => s.paceSecPerKm);
        const ys = samples.map((s) => s.strideLengthM);
        const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
        const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
        let num = 0;
        let denomX = 0;
        let denomY = 0;
        for (let i = 0; i < xs.length; i++) {
            const dx = xs[i] - meanX;
            const dy = ys[i] - meanY;
            num += dx * dy;
            denomX += dx * dx;
            denomY += dy * dy;
        }
        const denom = Math.sqrt(denomX * denomY);
        if (denom > 0) correlation = num / denom;
        // Regression slope: dy/dx
        if (denomX > 0) slope = num / denomX;
    }

    // Reasonable human ranges: 0.7–1.4 m for distance runners
    const qualityNote =
        avg < 0.7
            ? 'Short strides — could indicate a tight or fatigued gait.'
            : avg > 1.4
              ? 'Long, powerful strides — typical of a trained distance runner.'
              : 'Stride length is in a typical recreational range.';

    return {
        available: true,
        samples: samples.length,
        avgStrideLengthM: avg,
        minStrideLengthM: min,
        maxStrideLengthM: max,
        strideVariabilityPct: variabilityPct,
        paceStrideCorrelation: correlation,
        stridePerPaceSec: slope,
        message: qualityNote,
    };
}

// ============== LACTATE THRESHOLD AUTO-DETECT ==============

export type LTMethod = 'fastest_30min' | 'fastest_20min' | 'hr_inflection' | 'unavailable';

export interface LactateThreshold {
    available: boolean;
    reason?: string;
    method: LTMethod;
    methodLabel: string;
    ltPaceSecPerKm: number | null;
    ltPaceFormatted: string;
    ltHR: number | null;
    ltHRPercent: number | null;
    /** % of vVO2max — i.e. velocity at LT relative to estimated VO2max velocity. */
    velocityAtLT: number | null;
    confidence: number; // 0–1
    message: string;
}

/**
 * Estimates lactate threshold (LT) — the pace above which lactate
 * accumulates faster than clearance.
 *
 * We try methods in order of reliability, picking the first one with
 * enough data:
 *
 *   1. **Fastest sustained 30-min effort** — Daniels' canonical method.
 *      LT pace ≈ the pace you can hold for ~60 min in a steady state,
 *      which roughly corresponds to a 30-min all-out effort.
 *   2. **Fastest sustained 20-min effort** — fallback for shorter runs
 *      (20 min is a bit hot, so we discount the result by 0.97 — the
 *      empirical Riegel-ish correction).
 *   3. **HR inflection** — the pace at which HR sits at ~88% of maxHR
 *      for at least 5 sustained minutes. Useful for runs without
 *      race-pace efforts but enough tempo work.
 */
export function detectLactateThreshold(
    stream: ActivityStream,
    maxHR: number = 180,
): LactateThreshold {
    if (!stream.distance || !stream.time || stream.distance.length < 2) {
        return {
            available: false,
            reason: 'No distance/time stream.',
            method: 'unavailable',
            methodLabel: 'N/A',
            ltPaceSecPerKm: null,
            ltPaceFormatted: '',
            ltHR: null,
            ltHRPercent: null,
            velocityAtLT: null,
            confidence: 0,
            message: '',
        };
    }

    const totalTime = stream.time[stream.time.length - 1] || 0;

    const slidingWindowFastest = (windowSec: number): { timeSec: number; startIdx: number; endIdx: number } | null => {
        let bestTime = Infinity;
        let bestStart = 0;
        let bestEnd = 0;
        let j = 0;
        for (let i = 0; i < stream.time.length; i++) {
            const tStart = stream.time[i] || 0;
            while (
                j < stream.time.length &&
                (stream.time[j] || 0) - tStart < windowSec
            ) {
                j++;
            }
            if (j >= stream.time.length) break;
            const tEnd = stream.time[j] || 0;
            const dStart = stream.distance[i] || 0;
            const dEnd = stream.distance[j] || 0;
            const dist = dEnd - dStart;
            const dt = tEnd - tStart;
            if (dist > 0 && dt > 0 && dt < bestTime) {
                bestTime = dt;
                bestStart = i;
                bestEnd = j;
            }
        }
        return bestTime === Infinity ? null : { timeSec: bestTime, startIdx: bestStart, endIdx: bestEnd };
    };

    let chosen: LactateThreshold = {
        available: false,
        reason: '',
        method: 'unavailable',
        methodLabel: 'N/A',
        ltPaceSecPerKm: null,
        ltPaceFormatted: '',
        ltHR: null,
        ltHRPercent: null,
        velocityAtLT: null,
        confidence: 0,
        message: '',
    };

    // Method 1: 30-min window
    if (totalTime >= 30 * 60) {
        const w = slidingWindowFastest(30 * 60);
        if (w) {
            const dStart = stream.distance[w.startIdx] || 0;
            const dEnd = stream.distance[w.endIdx] || 0;
            const dist = dEnd - dStart;
            if (dist > 0) {
                const pace = (w.timeSec / dist) * 1000;
                // Avg HR inside the window
                let hrSum = 0;
                let hrCount = 0;
                if (stream.heartrate) {
                    for (let i = w.startIdx; i <= w.endIdx; i++) {
                        const hr = stream.heartrate[i];
                        if (hr != null) {
                            hrSum += hr;
                            hrCount++;
                        }
                    }
                }
                const ltHR = hrCount > 0 ? Math.round(hrSum / hrCount) : null;
                chosen = {
                    available: true,
                    method: 'fastest_30min',
                    methodLabel: '30-min sustained effort',
                    ltPaceSecPerKm: pace,
                    ltPaceFormatted: formatPace(pace),
                    ltHR,
                    ltHRPercent:
                        ltHR != null ? (ltHR / maxHR) * 100 : null,
                    velocityAtLT: 1000 / pace,
                    confidence: 0.85,
                    message:
                        'Estimated from your fastest sustained 30-min effort — the standard Daniels method.',
                };
            }
        }
    }

    // Method 2: 20-min window (shorter runs)
    if (!chosen.available && totalTime >= 20 * 60) {
        const w = slidingWindowFastest(20 * 60);
        if (w) {
            const dStart = stream.distance[w.startIdx] || 0;
            const dEnd = stream.distance[w.endIdx] || 0;
            const dist = dEnd - dStart;
            if (dist > 0) {
                // Discount 20-min effort by 0.97 — short efforts are slightly
                // hot relative to true LT pace.
                const rawPace = (w.timeSec / dist) * 1000;
                const pace = rawPace * 0.97;
                let hrSum = 0;
                let hrCount = 0;
                if (stream.heartrate) {
                    for (let i = w.startIdx; i <= w.endIdx; i++) {
                        const hr = stream.heartrate[i];
                        if (hr != null) {
                            hrSum += hr;
                            hrCount++;
                        }
                    }
                }
                const ltHR = hrCount > 0 ? Math.round(hrSum / hrCount) : null;
                chosen = {
                    available: true,
                    method: 'fastest_20min',
                    methodLabel: '20-min sustained effort (adjusted)',
                    ltPaceSecPerKm: pace,
                    ltPaceFormatted: formatPace(pace),
                    ltHR,
                    ltHRPercent:
                        ltHR != null ? (ltHR / maxHR) * 100 : null,
                    velocityAtLT: 1000 / pace,
                    confidence: 0.7,
                    message:
                        'Estimated from your fastest 20-min effort and adjusted down 3% — a shorter run can only give a rough LT estimate.',
                };
            }
        }
    }

    // Method 3: HR inflection (~88% of maxHR sustained for 5+ min)
    if (!chosen.available && stream.heartrate) {
        const targetHR = maxHR * 0.88;
        const windowSec = 5 * 60;
        let j = 0;
        let bestPace = Infinity;
        let bestAvgHR = 0;
        for (let i = 0; i < stream.heartrate.length; i++) {
            const tStart = stream.time[i] || 0;
            while (
                j < stream.heartrate.length &&
                (stream.time[j] || 0) - tStart < windowSec
            ) {
                j++;
            }
            if (j >= stream.heartrate.length) break;
            let sum = 0;
            let count = 0;
            for (let k = i; k <= j; k++) {
                const hr = stream.heartrate[k];
                if (hr != null) {
                    sum += hr;
                    count++;
                }
            }
            if (count === 0) continue;
            const avgHR = sum / count;
            if (avgHR < targetHR) continue;
            // Pace over the window
            const dStart = stream.distance[i] || 0;
            const dEnd = stream.distance[j] || 0;
            const dist = dEnd - dStart;
            const dt = (stream.time[j] || 0) - tStart;
            if (dist <= 0 || dt <= 0) continue;
            const pace = (dt / dist) * 1000;
            if (pace < bestPace) {
                bestPace = pace;
                bestAvgHR = Math.round(avgHR);
            }
        }
        if (bestPace !== Infinity) {
            chosen = {
                available: true,
                method: 'hr_inflection',
                methodLabel: 'HR inflection (~88% of maxHR)',
                ltPaceSecPerKm: bestPace,
                ltPaceFormatted: formatPace(bestPace),
                ltHR: bestAvgHR,
                ltHRPercent: (bestAvgHR / maxHR) * 100,
                velocityAtLT: 1000 / bestPace,
                confidence: 0.55,
                message:
                    'Estimated from the fastest 5-min window where HR sat near 88% of maxHR — only used when no race-pace effort is in the run.',
            };
        }
    }

    if (!chosen.available) {
        return {
            ...chosen,
            reason:
                'No sustained race-pace effort in this run, and HR stream did not show a clear inflection. Try a dedicated tempo or threshold session for a more reliable estimate.',
        };
    }
    return chosen;
}

