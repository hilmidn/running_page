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
 */
export function getHRZone(hrPercent: number): number {
    if (hrPercent < 60) return 1; // Z1: Recovery
    if (hrPercent < 70) return 2; // Z2: Endurance
    if (hrPercent < 80) return 3; // Z3: Aerobic
    if (hrPercent < 90) return 4; // Z4: Tempo
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
 * Create pace zone distribution based on activity average pace
 * Strava-like zones: calculated relative to the activity's overall avg pace
 *
 * Z1 Recovery  → > 110% of avg pace (slowest)
 * Z2 Aerobic   → 103–110%
 * Z3 Tempo     → 97–103%  (around average)
 * Z4 Threshold → 90–97%
 * Z5 VO2 Max   → < 90% of avg pace (fastest)
 */
export function createPaceZoneData(
    stream: ActivityStream,
    totalTimeSeconds: number,
): PaceZoneData[] {
    if (stream.distance.length === 0 || totalTimeSeconds === 0) return [];

    const paces = calculateInstantPace(stream);
    const validPaces = paces.filter(p => p.valid).map(p => p.pace);

    if (validPaces.length === 0) return [];

    const avgPace = validPaces.reduce((a, b) => a + b, 0) / validPaces.length;

    const zones = [
        {
            zone: 'Z1',
            label: 'Recovery',
            minFactor: 1.10,
            maxFactor: Infinity,
            color: '#10b981',
        },
        {
            zone: 'Z2',
            label: 'Aerobic',
            minFactor: 1.03,
            maxFactor: 1.10,
            color: '#3b82f6',
        },
        {
            zone: 'Z3',
            label: 'Tempo',
            minFactor: 0.97,
            maxFactor: 1.03,
            color: '#f59e0b',
        },
        {
            zone: 'Z4',
            label: 'Threshold',
            minFactor: 0.90,
            maxFactor: 0.97,
            color: '#f97316',
        },
        {
            zone: 'Z5',
            label: 'VO₂ Max',
            minFactor: 0,
            maxFactor: 0.90,
            color: '#ef4444',
        },
    ];

    const zoneData: PaceZoneData[] = zones.map(
        ({ zone, label, minFactor, maxFactor, color }) => {
            let timeInZone = 0;
            let paceSum = 0;
            let count = 0;
            let minPaceInZone = Infinity;
            let maxPaceInZone = 0;

            for (let i = 0; i < paces.length; i++) {
                if (!paces[i].valid) continue;
                const pace = paces[i].pace;

                // Lower sec/km = faster. Z1 is slowest (highest sec/km)
                if (pace > avgPace * minFactor && pace <= avgPace * maxFactor) {
                    timeInZone += 1;
                    paceSum += pace;
                    count++;
                    if (pace < minPaceInZone) minPaceInZone = pace;
                    if (pace > maxPaceInZone) maxPaceInZone = pace;
                }
            }

            const percentage = (timeInZone / totalTimeSeconds) * 100;
            const avgPaceInZoneValue = count > 0 ? paceSum / count : 0;
            const cappedMin = minPaceInZone === Infinity ? avgPace * minFactor : minPaceInZone;
            const cappedMax = maxPaceInZone === 0 ? (maxFactor === Infinity ? avgPace * 1.3 : avgPace * maxFactor) : maxPaceInZone;

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

    for (let i = startIdx; i < endIdx; i++) {
        const segDist = (stream.distance[i + 1] || 0) - (stream.distance[i] || 0);
        const segTime = (stream.time[i + 1] || 0) - (stream.time[i] || 0);
        if (segDist > 0 && segTime > 0) {
            const pace = calculatePace(segDist, segTime);
            if (pace > 0 && isFinite(pace)) {
                minPace = Math.min(minPace, pace);
                maxPace = Math.max(maxPace, pace);
            }
        }
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
