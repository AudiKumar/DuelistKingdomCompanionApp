/* Parallax Pixel Stars start screen — ported from the "Pure CSS Parallax Pixel Stars" pen
   into React Native using only packages already imported in the project:
   react-native, react-native-svg, @react-navigation/native. */

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View, Dimensions, Animated, Easing, TouchableOpacity, Platform } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
type StarLayerProps = {
  count: number;
  size: number;
  duration: number; //TODO: Remove Usage
  opacity?: number;
};

function StarLayer({ count, size, duration, opacity = 1 }: StarLayerProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  // Generate the random star positions once per mount, not on every render
  const stars = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        left: Math.random() * width,
        top: Math.random() * height,
      })),
    [count]
  );

useFocusEffect(
    useCallback(() => {
      // Always start from a known value so re-focusing doesn't leave the
      // layer mid-cycle or cause a visible jump.
      translateY.setValue(0);
 
      const loop = Animated.loop(
        Animated.timing(translateY, {
          toValue: -height,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        { iterations: -1 } // -1 = loop forever, never stops on its own
      );
      loop.start();
 
      // Stop (don't just pause) when the screen loses focus, and restart
      // fresh via this same effect the next time it gains focus.
      return () => loop.stop();
    }, [translateY, duration])
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {/* Primary field */}
      {stars.map((s, i) => (
        <View
          key={`a-${i}`}
          style={[
            styles.star,
            { left: s.left, top: s.top, width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      ))}
      {/* Duplicate field, offset by one screen height, for a seamless loop */}
      {stars.map((s, i) => (
        <View
          key={`b-${i}`}
          style={[
            styles.star,
            {
              left: s.left,
              top: s.top + height,
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

export default function StartScreen() {
  const navigation = useNavigation();
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 700,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [cursorOpacity]);

  return (
    <View style={styles.container}>
      {/* radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%) */}
      <Svg height={height} width={width} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="bg" cx="50%" cy="100%" rx="90%" ry="70%" gradientUnits="userSpaceOnUse" fx="50%" fy="100%">
            <Stop offset="0" stopColor="#9A416FFF" stopOpacity="1" />
            <Stop offset="1" stopColor="#090A0F" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="#090A0F" />
        <Rect x={0} y={0} width={width} height={height} fill="url(#bg)" />
      </Svg>

      {/* #stars / #stars2 / #stars3 */}
      <StarLayer count={140} size={1} duration={50000} opacity={0.9} />
      <StarLayer count={70} size={2} duration={100000} opacity={0.85} />
      <StarLayer count={35} size={3} duration={150000} />

      {/* #title */}
      <View style={styles.content}>
        <View style={styles.titleWrapper}>
          <Text style={styles.title} numberOfLines={1}>
            DUELIST KINGDOM
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            COMPANION
          </Text>

          <TouchableOpacity
            style={styles.startBtn}
            activeOpacity={0.8}
            onPress={() => (navigation.navigate as any)("Duel")}
          >
            <Animated.Text style={[styles.startBtnText, { opacity: cursorOpacity }]}>
              ▸
            </Animated.Text>
            <Text style={styles.startBtnText}> START</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090A0F",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  star: {
    position: "absolute",
    backgroundColor: "rgb(255, 230, 0)",
  },
  content: {
    zIndex: 10,
  },
  titleWrapper: {
    flexDirection: "column",
    alignItems: "center",
  },
  eyebrow: {
    color: "#8fa3bf",
    fontSize: 12,
    letterSpacing: 6,
    fontWeight: "300",
    marginBottom: 14,
    fontFamily: Platform.select({ ios: undefined, android: undefined, default: "sans-serif" }),
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "300",
    letterSpacing: 8,
    textAlign: "center",
    fontFamily: "mainFont",
  },
  subtitle: {
    color: "#c7d3e0",
    fontSize: 22,
    fontWeight: "300",
    letterSpacing: 10,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 60,
    fontFamily: "mainFont",
  },
  startBtn: {
    flexDirection: "row",
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: "#c7d3e0",
    alignItems: "center",
    justifyContent: "center",
  },
  startBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    letterSpacing: 4,
    fontFamily: "altFont",
  },
});