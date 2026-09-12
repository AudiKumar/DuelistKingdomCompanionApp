import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Animated,
  Easing,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");
const USER_NAME_KEY = "@duelist_kingdom_user_name";
const USER_STAR_BALANCE = "@dk_star_wallet";
const USER_KAIBUCKS_BALANCE = "@dk_kaibucks";

type StarLayerProps = {
  count: number;
  size: number;
  duration: number; //TODO: Remove Usage
  opacity?: number;
};

function StarLayer({ count, size, duration, opacity = 1 }: StarLayerProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  // Generate star coordinates once
  const stars = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        left: Math.random() * width,
        top: Math.random() * height,
      })),
    [count]
  );

  // Manage animation lifecycle cleanly
  useFocusEffect(
    useCallback(() => {
      translateY.setValue(0);

      const animation = Animated.loop(
        Animated.timing(translateY, {
          toValue: -height,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      animation.start();

      return () => {
        animation.stop();
      };
    }, [duration, translateY])
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Primary star set */}
        {stars.map((s, i) => (
          <View
            key={`star-a-${i}`}
            style={[
              styles.star,
              {
                left: s.left,
                top: s.top,
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
          />
        ))}

        {/* Seamless tiling duplicate set shifted down by 1 screen height */}
        {stars.map((s, i) => (
          <View
            key={`star-b-${i}`}
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
    </View>
  );
}

export default function StartScreen() {
  const navigation = useNavigation();
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  // states for user modal
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState("");

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

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const storedName = await AsyncStorage.getItem(USER_NAME_KEY);
        if (!isMounted) return;

        if (storedName === null) {
          setShowNameModal(true);
          try {
            await AsyncStorage.multiSet([
              [USER_STAR_BALANCE, "10"],
              [USER_KAIBUCKS_BALANCE, "500"],
            ]);
          } catch (walletError) {
            console.error("Failed to initialize wallet balance", walletError);
          }
        }
      } catch (error) {
        console.error("Failed to read user name from AsyncStorage", error);
        setShowNameModal(true);
      } finally {
        if (isMounted) setIsCheckingUser(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveName = useCallback(async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    try {
      await AsyncStorage.setItem(USER_NAME_KEY, trimmed);
      setShowNameModal(false);
    } catch (error) {
      console.error("Failed to save user name to AsyncStorage", error);
    }
  }, [nameInput]);

  const handleResetStorage = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(USER_NAME_KEY);
      setNameInput("");
      setShowNameModal(true);
    } catch (error) {
      console.error("Failed to clear name", error);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="bg" cx="50%" cy="100%" rx="90%" ry="70%" gradientUnits="userSpaceOnUse" fx="50%" fy="100%">
            <Stop offset="0" stopColor="#9A416FFF" stopOpacity="1" />
            <Stop offset="1" stopColor="#090A0F" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width="100%"  height="100%"  fill="#090A0F" />
        <Rect x={0} y={0} width="100%"  height="100%" fill="url(#bg)" />
      </Svg>

      <StarLayer count={140} size={1} duration={50000} opacity={0.9} />
      <StarLayer count={70} size={2} duration={100000} opacity={0.85} />
      <StarLayer count={35} size={3} duration={150000} />

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
            onPress={() => (navigation.navigate as any)("Welcome")}
          >
            <Animated.Text style={[styles.startBtnText, { opacity: cursorOpacity }]}>
              ▸
            </Animated.Text>
            <Text style={styles.startBtnText}> START</Text>
          </TouchableOpacity>

          {/* CHANGE NAME BUTTONS */}
          {<TouchableOpacity
            style={styles.renameBtn}
            activeOpacity={0.8}
            onPress={handleResetStorage}
          >
            <Text style={styles.renameBtnText}>CHANGE NAME</Text>
          </TouchableOpacity>}
        </View>
      </View>

      <Modal
        visible={!isCheckingUser && showNameModal}
        animationType="fade"
        transparent
        supportedOrientations={['landscape']}
        onRequestClose={() => {}}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Welcome, Duelist</Text>
            <Text style={styles.modalSubtitle}>What should we call you?</Text>

            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name"
              placeholderTextColor="#8fa3bf"
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />

            <TouchableOpacity
              style={[styles.modalButton, !nameInput.trim() && styles.modalButtonDisabled]}
              activeOpacity={0.8}
              onPress={handleSaveName}
              disabled={!nameInput.trim()}
            >
              <Text style={styles.modalButtonText}>CONTINUE</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  renameBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    //backgroundColor: 'rgb(37, 28, 78)',
    alignItems: "center",
    justifyContent: "center",
  },
  renameBtnText: {
    color:  "#FFFFFF",
    fontSize: 12,
    letterSpacing: 2,
    fontFamily: "altFont",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(9, 10, 15, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#1B2735",
    borderWidth: 1,
    borderColor: "#c7d3e0",
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "300",
    letterSpacing: 3,
  },
  modalSubtitle: {
    color: "#8fa3bf",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 20,
  },
  modalInput: {
    width: "100%",
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#c7d3e0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  modalButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#c7d3e0",
    paddingVertical: 12,
    alignItems: "center",
  },
  modalButtonDisabled: {
    opacity: 0.4,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    letterSpacing: 3,
  },
});