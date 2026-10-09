import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { useExpenses } from '@/context/expense-context';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/card';
import { fetchLiveWeatherData, DEFAULT_WEATHER_DATA, type WeatherData } from '@/utils/weather';
import { AnimatedWeather } from '@/components/animated-weather';
import { WeatherBackground } from '@/components/weather-background';

export default function WeatherScreen() {
  const theme = useTheme();
  const { temperatureUnit } = useExpenses();
  const [weather, setWeather] = useState<WeatherData>(DEFAULT_WEATHER_DATA);
  const [refreshing, setRefreshing] = useState(false);

  const isDark = theme.text === '#ffffff';

  const handleRefresh = async () => {
    setRefreshing(true);
    const data = await fetchLiveWeatherData();
    setWeather(data);
    setRefreshing(false);
  };

  useEffect(() => {
    let isMounted = true;
    void fetchLiveWeatherData().then((data) => {
      if (isMounted) {
        setWeather(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const formatTemp = (tempC: number) => {
    if (temperatureUnit === 'F') {
      return `${Math.round((tempC * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(tempC)}°C`;
  };

  const formatTempNum = (tempC: number) => {
    if (temperatureUnit === 'F') {
      return `${Math.round((tempC * 9) / 5 + 32)}°`;
    }
    return `${Math.round(tempC)}°`;
  };

  // Calculate global min and max across 5-day forecast for the visual temp bar
  const weekMin = Math.min(...weather.dailyForecast.map((d) => d.tempMinC), weather.tempMinC);
  const weekMax = Math.max(...weather.dailyForecast.map((d) => d.tempMaxC), weather.tempMaxC);
  const weekSpan = Math.max(1, weekMax - weekMin);

  // Dynamic Theme Colors for Light & Dark mode
  const hourlyPillBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)';
  const hourlyPillBorder = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)';
  const hourlyActiveBg = isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(56, 189, 248, 0.15)';
  const rainBadgeBg = isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(14, 165, 233, 0.14)';
  const rainBadgeColor = isDark ? '#38BDF8' : '#0284C7';
  const gaugeTrackBg = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
  const tempBarTrackBg = isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(0, 0, 0, 0.08)';
  const forecastMaxColor = isDark ? '#4ADE80' : '#16A34A';
  const insightCardBg = isDark ? theme.card : '#FEFCE8';
  const insightBorderColor = isDark ? 'rgba(250, 204, 21, 0.25)' : 'rgba(245, 158, 11, 0.35)';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.accent} />
      }
    >
      {/* HERO WEATHER CARD */}
      <View style={styles.heroCard}>
        <WeatherBackground conditionType={weather.conditionType} />
        <View style={styles.heroOverlay}>
          <View style={styles.topBadgesRow}>
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={13} color="#38BDF8" />
              <ThemedText style={styles.badgeText}>{weather.locationName}</ThemedText>
            </View>
            <View style={styles.timeBadge}>
              <View style={[styles.liveDot, { backgroundColor: weather.isNight ? '#C084FC' : '#FBBF24' }]} />
              <ThemedText style={styles.badgeText}>{weather.isNight ? 'Night View' : 'Day View'}</ThemedText>
            </View>
          </View>

          <View style={styles.heroCenter}>
            <AnimatedWeather conditionType={weather.conditionType} size={54} />
            <ThemedText style={styles.giantTemp}>{formatTemp(weather.tempC)}</ThemedText>
            <ThemedText style={styles.conditionText}>{weather.condition}</ThemedText>
            <View style={styles.highLowPill}>
              <ThemedText style={styles.highText}>↑ {formatTemp(weather.tempMaxC)}</ThemedText>
              <ThemedText style={styles.highLowDivider}>•</ThemedText>
              <ThemedText style={styles.lowText}>↓ {formatTemp(weather.tempMinC)}</ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* 24-HOUR HOURLY FORECAST CAROUSEL */}
      <Card style={styles.hourlyCard}>
        <View style={styles.hourlyHeaderRow}>
          <View style={styles.hourlyHeaderLeft}>
            <Ionicons name="time" size={16} color={rainBadgeColor} />
            <ThemedText style={styles.hourlyHeaderTitle}>24-HOUR FORECAST</ThemedText>
          </View>
          <ThemedText style={styles.hourlyHeaderBadge}>Hourly</ThemedText>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hourlyScrollContent}
        >
          {weather.hourlyForecast.map((hour, idx) => (
            <View
              key={hour.time || idx}
              style={[
                styles.hourlyPill,
                { backgroundColor: hourlyPillBg, borderColor: hourlyPillBorder },
                idx === 0 && { backgroundColor: hourlyActiveBg, borderColor: rainBadgeColor, borderWidth: 1.5 },
              ]}
            >
              <ThemedText style={[styles.hourlyLabel, idx === 0 && { color: rainBadgeColor, fontWeight: '800' }]}>
                {hour.hourLabel}
              </ThemedText>
              <View style={styles.hourlyIconBox}>
                <AnimatedWeather conditionType={hour.conditionType} size={24} />
              </View>
              <View style={styles.hourlyRainSlot}>
                {hour.rainProbability > 10 ? (
                  <View style={[styles.hourlyRainBadge, { backgroundColor: rainBadgeBg }]}>
                    <Ionicons name="umbrella" size={9} color={rainBadgeColor} />
                    <ThemedText style={[styles.hourlyRainText, { color: rainBadgeColor }]}>{hour.rainProbability}%</ThemedText>
                  </View>
                ) : null}
              </View>
              <ThemedText style={[styles.hourlyTemp, idx === 0 && { color: rainBadgeColor, fontWeight: '800' }]}>
                {formatTempNum(hour.tempC)}
              </ThemedText>
            </View>
          ))}
        </ScrollView>
      </Card>

      {/* METRICS GRID WITH PROGRESS GAUGE BARS */}
      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="umbrella" size={18} color="#0EA5E9" />
            </View>
            <ThemedText style={styles.metricLabel}>RAIN CHANCE</ThemedText>
          </View>
          <ThemedText type="defaultBold" style={styles.metricValue}>{weather.rainProbability}%</ThemedText>
          <View style={[styles.gaugeTrack, { backgroundColor: gaugeTrackBg }]}>
            <View style={[styles.gaugeFill, { width: `${Math.min(100, Math.max(5, weather.rainProbability))}%`, backgroundColor: '#0EA5E9' }]} />
          </View>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="water" size={18} color="#3B82F6" />
            </View>
            <ThemedText style={styles.metricLabel}>HUMIDITY</ThemedText>
          </View>
          <ThemedText type="defaultBold" style={styles.metricValue}>{weather.humidity}%</ThemedText>
          <View style={[styles.gaugeTrack, { backgroundColor: gaugeTrackBg }]}>
            <View style={[styles.gaugeFill, { width: `${Math.min(100, Math.max(5, weather.humidity))}%`, backgroundColor: '#3B82F6' }]} />
          </View>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Ionicons name="sparkles" size={18} color="#A855F7" />
            </View>
            <ThemedText style={styles.metricLabel}>WIND SPEED</ThemedText>
          </View>
          <ThemedText type="defaultBold" style={styles.metricValue}>{weather.windSpeedKmH} km/h</ThemedText>
          <View style={[styles.gaugeTrack, { backgroundColor: gaugeTrackBg }]}>
            <View style={[styles.gaugeFill, { width: `${Math.min(100, Math.max(10, (weather.windSpeedKmH / 50) * 100))}%`, backgroundColor: '#A855F7' }]} />
          </View>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="thermometer" size={18} color="#F59E0B" />
            </View>
            <ThemedText style={styles.metricLabel}>DAILY RANGE</ThemedText>
          </View>
          <ThemedText type="defaultBold" style={styles.metricValue}>{formatTempNum(weather.tempMinC)} - {formatTempNum(weather.tempMaxC)}</ThemedText>
          <View style={[styles.gaugeTrack, { backgroundColor: gaugeTrackBg }]}>
            <View style={[styles.gaugeFill, { width: '80%', backgroundColor: '#F59E0B' }]} />
          </View>
        </Card>
      </View>

      {/* FINANCIAL WEATHER INSIGHTS CARD */}
      <Card style={[styles.insightCard, { backgroundColor: insightCardBg, borderColor: insightBorderColor }]}>
        <View style={styles.insightBadge}>
          <Ionicons name="bulb" size={15} color="#D97706" />
          <ThemedText style={styles.insightBadgeText}>SMART MONEY & WEATHER ADVICE</ThemedText>
        </View>
        <ThemedText style={styles.insightBody}>{weather.financialTip}</ThemedText>
      </Card>

      {/* APPLE-WEATHER STYLE 5-DAY FORECAST CARD */}
      <Card style={styles.forecastCard}>
        <View style={styles.forecastHeaderRow}>
          <Ionicons name="calendar" size={16} color={rainBadgeColor} />
          <ThemedText type="defaultBold" style={styles.forecastTitle}>5-DAY FORECAST</ThemedText>
        </View>

        {weather.dailyForecast.map((item, index) => {
          const leftPercent = Math.max(0, Math.min(100, ((item.tempMinC - weekMin) / weekSpan) * 100));
          const rightPercent = Math.max(0, Math.min(100, ((item.tempMaxC - weekMin) / weekSpan) * 100));
          const widthPercent = Math.max(18, rightPercent - leftPercent);

          return (
            <View key={item.date || index} style={[styles.forecastRow, index < weather.dailyForecast.length - 1 && styles.forecastDivider]}>
              <ThemedText style={styles.dayNameText} numberOfLines={1}>{item.dayName}</ThemedText>
              <View style={styles.weatherIconBox}>
                <AnimatedWeather conditionType={item.conditionType} size={24} />
              </View>

              <View style={styles.rainPillSlot}>
                {item.rainProbability > 10 ? (
                  <View style={[styles.rainPill, { backgroundColor: rainBadgeBg }]}>
                    <Ionicons name="umbrella" size={9} color={rainBadgeColor} />
                    <ThemedText style={[styles.rainPillText, { color: rainBadgeColor }]}>{item.rainProbability}%</ThemedText>
                  </View>
                ) : null}
              </View>

              <ThemedText style={styles.forecastMinTemp}>{formatTempNum(item.tempMinC)}</ThemedText>

              {/* VISUAL TEMPERATURE RANGE BAR */}
              <View style={[styles.tempBarTrack, { backgroundColor: tempBarTrackBg }]}>
                <View
                  style={[
                    styles.tempBarFill,
                    {
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      backgroundColor: rainBadgeColor,
                    },
                  ]}
                />
              </View>

              <ThemedText style={[styles.forecastMaxTemp, { color: forecastMaxColor }]}>{formatTempNum(item.tempMaxC)}</ThemedText>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  heroCard: {
    height: 255,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    padding: 20,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  topBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.50)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.50)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  heroCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  giantTemp: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 54,
    marginTop: 8,
  },
  conditionText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  highLowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 8,
  },
  highText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '700',
  },
  highLowDivider: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 12,
  },
  lowText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  hourlyCard: {
    padding: 16,
    gap: 12,
    borderRadius: 22,
  },
  hourlyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 2,
  },
  hourlyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hourlyHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    opacity: 0.8,
  },
  hourlyHeaderBadge: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.5,
  },
  hourlyScrollContent: {
    gap: 10,
    paddingVertical: 2,
  },
  hourlyPill: {
    width: 78,
    height: 128,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  hourlyLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    opacity: 0.9,
  },
  hourlyIconBox: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourlyRainSlot: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourlyRainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  hourlyRainText: {
    fontSize: 11,
    fontWeight: '800',
    includeFontPadding: false,
  },
  hourlyTemp: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    flexGrow: 1,
    padding: 14,
    gap: 8,
    borderRadius: 20,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    opacity: 0.65,
  },
  metricValue: {
    fontSize: 17,
  },
  gaugeTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 2,
  },
  insightCard: {
    padding: 16,
    gap: 10,
    borderRadius: 22,
    borderWidth: 1,
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  insightBadgeText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  insightBody: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.9,
  },
  forecastCard: {
    padding: 16,
    gap: 12,
    borderRadius: 22,
  },
  forecastHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  forecastTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    opacity: 0.8,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  forecastDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.18)',
  },
  dayNameText: {
    width: 85,
    fontSize: 14,
    fontWeight: '600',
  },
  weatherIconBox: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rainPillSlot: {
    width: 52,
    alignItems: 'center',
  },
  rainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rainPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  forecastMinTemp: {
    width: 32,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    textAlign: 'right',
  },
  tempBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  tempBarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 2.5,
  },
  forecastMaxTemp: {
    width: 32,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'left',
  },
});
