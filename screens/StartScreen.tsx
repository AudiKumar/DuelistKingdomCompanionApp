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
  Modal,        // ADDED: for the name-entry modal (https://reactnative.dev/docs/modal)
  TextInput,    // ADDED: for capturing the user's name
  KeyboardAvoidingView, // ADDED: keeps the input visible above the keyboard on iOS
} from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // ADDED: cross-platform key-value storage (web/iOS/Android)

const { width, height } = Dimensions.get("window");
const USER_NAME_KEY = "@duelist_kingdom_user_name";

type StarLayerProps = {
  count: number;
  size: number;
  duration: number; //TODO: Remove Usage
  opacity?: number;
};

//todo: add kaibucks
function StarLayer({ count, size, duration, opacity = 1 }: StarLayerProps) {
  const translateY = useRef(new Animated.Value(0)).current;

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
      translateY.setValue(0);

      const loop = Animated.loop(
        Animated.timing(translateY, {
          toValue: -height,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        { iterations: -1 }
      );
      loop.start();

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
      {stars.map((s, i) => (
        <View
          key={`a-${i}`}
          style={[
            styles.star,
            { left: s.left, top: s.top, width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      ))}
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

  // ===== ADDED: check AsyncStorage on mount for an existing name entry =====
  // Runs once (empty dependency array) per React's useEffect docs:
  // https://react.dev/reference/react/useEffect
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const storedName = await AsyncStorage.getItem(USER_NAME_KEY); // ADDED
        if (!isMounted) return;

        if (storedName === null) {
          // ADDED: no entry found -> this is a first-time user, show the modal
          setShowNameModal(true);
        }
      } catch (error) {
        // ADDED: AsyncStorage reads can reject; decide your own fallback here.
        // Currently we still prompt for a name on read failure.
        console.error("Failed to read user name from AsyncStorage", error);
        setShowNameModal(true);
      } finally {
        if (isMounted) setIsCheckingUser(false); // ADDED
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);
  // ===== END ADDED EFFECT =====

  // ADDED: saves the entered name and closes the modal
  const handleSaveName = useCallback(async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    try {
      await AsyncStorage.setItem(USER_NAME_KEY, trimmed); // ADDED
      setShowNameModal(false);                            // ADDED
    } catch (error) {
      console.error("Failed to save user name to AsyncStorage", error);
    }
  }, [nameInput]);

  return (
    <View style={styles.container}>
      {/* UNCHANGED: background gradient */}
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

      <StarLayer count={140} size={1} duration={50000} opacity={0.9} />
      <StarLayer count={70} size={2} duration={100000} opacity={0.85} />
      <StarLayer count={35} size={3} duration={150000} />

      {/* UNCHANGED: title + start button */}
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
        </View>
      </View>

      {/* Modal that prompts the user for the */}
      <Modal
        visible={!isCheckingUser && showNameModal} // ADDED
        animationType="fade"
        transparent
        onRequestClose={() => {
          // this will prevent dismissal without entering a name
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay} // ADDED style, see below
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}> {/* ADDED style */}
            <Text style={styles.modalTitle}>Welcome, Duelist</Text> {/* ADDED style */}
            <Text style={styles.modalSubtitle}>What should we call you?</Text> {/* ADDED style */}

            <TextInput
              style={styles.modalInput} // ADDED style
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
              style={[styles.modalButton, !nameInput.trim() && styles.modalButtonDisabled]} // ADDED style
              activeOpacity={0.8}
              onPress={handleSaveName}
              disabled={!nameInput.trim()}
            >
              <Text style={styles.modalButtonText}>CONTINUE</Text> {/* ADDED style */}
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
  // ----- END UNCHANGED -----

  // ===== ADDED: styles for the name-entry modal =====
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
  // ===== END ADDED STYLES =====
});