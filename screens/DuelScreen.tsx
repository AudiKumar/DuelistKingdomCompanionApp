//TODO: pull wagered chips, wallet, and starting lifepoints from real game/navigation state
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WagerType } from './WelcomeScreen';

type LifePointAction = 'add' | 'subtract' | null;

const USER_WAGER_TYPE = "@user_wager_type";
const USER_STARS_WAGERED = "@user_stars_wagered";
const OP_WAGER_TYPE = "@op_wager_type";
const USER_STAR_BALANCE = "@dk_star_wallet";
const USER_KAIBUX_BALANCE = "@dk_kaibux";

export default function DuelScreen() {

  const [userWagerType, setUserWagerType] = useState<WagerType>(null);
  const [opWagerType, setOpWagerType] = useState<WagerType>(null);
  const [userStarsWaged, setUserStarsWaged] = useState(0);
  const [starWalletBalance, setStarWalletBalance] = useState(0);
  const [kaibuxBalance, setKaibuxBalance] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const userWagedType = await AsyncStorage.getItem(USER_WAGER_TYPE);
        const opWagedType = await AsyncStorage.getItem(OP_WAGER_TYPE);
        const userStarWager = await AsyncStorage.getItem(USER_STARS_WAGERED); 
        const stars = await AsyncStorage.getItem(USER_STAR_BALANCE);
        const kaibux = await AsyncStorage.getItem(USER_KAIBUX_BALANCE);

        setUserWagerType(userWagedType as WagerType);
        setOpWagerType(opWagedType as WagerType);
        setUserStarsWaged(Number(userStarWager)); 
        setStarWalletBalance(Number(stars)); 
        setKaibuxBalance(Number(kaibux));
      } catch (error) {
        console.error("failed to read and get required fields for duel screen")
      }

    })(); 
  }, [])

  const navigation = useNavigation();

  // TODO: wire these up to real data (likely passed in via navigation params
  // from the WelcomeScreen wager flow)

  const [lifePoints, setLifePoints] = useState(6000); 
  const [duelEnded, setDuelEnded] = useState(false); // this is for when the duel has ended by the user's life points have been depleted
  const [lifePointsModalVisible, setLifePointsModalVisible] = useState(false);
  const [lifePointsAction, setLifePointsAction] = useState<LifePointAction>(null);
  const [lifePointsInput, setLifePointsInput] = useState('');
  const lifePointsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null); // Ref to store the interval ID for clearing later

  const duelDiskStartPlayer = useAudioPlayer(require('../assets/duel-disk-start.wav'));
  const duelDiskStartStatus = useAudioPlayerStatus(duelDiskStartPlayer);
  const duelStartedRef = useRef(false); // Ref to track if the duel has started to prevent replaying the sound

  const beepLoSrc = require('../assets/beep-lo.wav');
  
  const beepLoPlayerA = useAudioPlayer(beepLoSrc);
  const beepLoPlayerB = useAudioPlayer(beepLoSrc);
  const beepLoPlayers = [beepLoPlayerA, beepLoPlayerB]; // Array of beepLo players to alternate between
  const beepHiPlayer = useAudioPlayer(require('../assets/beep-hi.wav'));
  const beepLoIndex = useRef(0); // Ref to keep track of which beepLo player to use next

  const [coinFlipModalVisible, setCoinFlipModalVisible] = useState(false);
  const [diceModalVisible, setDiceModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  function handleEndDuel() {
    showAlert('You lost the duel!');
    (navigation.navigate as any)('Welcome');
  }

  function showAlert(message: string) {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert(message);
    }
  }

  function openLifePointsModal(action: LifePointAction) {
    setLifePointsAction(action);
    setLifePointsInput('');
    setLifePointsModalVisible(true);
  }

  function flipCoin() : String {
    const coin = Math.floor(Math.random() * 2) 
    return coin === 0 ? "HEADS": "TAILS"
  }

  function rollDice (): number {
    const dice = Math.floor(Math.random() * 6) + 1
    return dice; 
  }

  function closeLifePointsModal() {
    setLifePointsModalVisible(false);
    setLifePointsAction(null);
  }

  function stopLifePointsAnimation() {
    if (lifePointsIntervalRef.current) {
      clearInterval(lifePointsIntervalRef.current);
      lifePointsIntervalRef.current = null;
    }
  }

  useEffect(() => {
    // Set Audio mode
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' })
    // Cleanup on unmount
    return () => stopLifePointsAnimation();
  }, []);

  useEffect(() => {
    if (duelDiskStartStatus.isLoaded && !duelStartedRef.current) {
      duelStartedRef.current = true; // Mark the duel as started to prevent replaying the sound on double-load
      duelDiskStartPlayer.play();
    }
  }, [duelDiskStartStatus.isLoaded]);

  function playLifePointBeepLo() {
    const player = beepLoPlayers[beepLoIndex.current];
    beepLoIndex.current = (beepLoIndex.current + 1) % beepLoPlayers.length;
    player.seekTo(0);
    player.play();
  }

  function playLifePointBeepHi() {
    beepHiPlayer.seekTo(0);
    beepHiPlayer.play();
  }

  function confirmLifePoints() {
    const amount = Number(lifePointsInput);

    if (!lifePointsInput.trim() || Number.isNaN(amount) || amount <= 0) {
      showAlert('Enter a valid number of lifepoints.');
      return;
    }

    // Configuration
    const beepNumberInterval = 200; // How often a beep happens in terms of number of life points changed
    const timeBetweenBeepsMs = 250; // How often a beep happens in milliseconds
    const lifePointChangeAmount = 10; // How much life points change per "tick" of the animation interval

    // Calculation
    const intervalMs = timeBetweenBeepsMs / (beepNumberInterval / lifePointChangeAmount); // Calculate the interval in milliseconds based on the desired beep frequency
    const startTime = Date.now(); // Store the start time of the animation; we will use this to calculated elapsed time in case the interval gets throttled
    const originalLifePoints = lifePoints; // Store the original life points to calculate the expected number of ticks based on elapsed time
    const dir = lifePointsAction === 'add' ? 1 : -1;
    const targetLifePoints = Math.max(0, lifePoints + dir * amount);
    const reachedTarget = lifePointsAction === 'add' ? ((lp: number, tgt: number) => lp >= tgt) : ((lp: number, tgt: number) => lp <= tgt);
    const nextBeepThreshold = lifePointsAction === 'add' ? ((lp: number) => beepNumberInterval * (Math.floor(lp / beepNumberInterval) + dir)) : ((lp: number) => beepNumberInterval * (Math.ceil(lp / beepNumberInterval) + dir));

    stopLifePointsAnimation(); // Stop any existing animation before starting a new one

    const prevLifePointsRef = { current: originalLifePoints }; // Ref to store the previous life points for beep threshold checking
    
    if (Math.abs(targetLifePoints - originalLifePoints) >= beepNumberInterval) {
      playLifePointBeepLo(); // Play the first beep immediately if the change is large enough
    }
    // Animation
    lifePointsIntervalRef.current = setInterval(() => {
      const elapsedTime = Date.now() - startTime; // Calculate the elapsed time since the animation started
      const expectedTicks = Math.floor(elapsedTime / intervalMs); // Calculate the expected number of ticks based on elapsed time
      let nextLifePoints = originalLifePoints + dir * lifePointChangeAmount * expectedTicks; // Calculate the next life points based on the expected number of ticks
      if (reachedTarget(nextLifePoints, targetLifePoints)) {
        nextLifePoints = targetLifePoints;
        stopLifePointsAnimation();
        playLifePointBeepHi();
      }
      else if (reachedTarget(nextLifePoints, nextBeepThreshold(prevLifePointsRef.current))) {
        playLifePointBeepLo();
      }
      prevLifePointsRef.current = nextLifePoints; // Update the previous life points for the next interval check
      setLifePoints(nextLifePoints);
    }, intervalMs);
    closeLifePointsModal();
  }

  function handleForfeit() {
    setSettingsModalVisible(false);
    showAlert('You forfeited the duel.');
    (navigation.navigate as any)('Welcome');
  }

  async function handleWin() {
    console.log("Handle win")
    const opStarsWagered = opWagerType === "STARS" ? (userWagerType === "STARS" ? userStarsWaged : 1) : 0;
    const starsWon = userStarsWaged + opStarsWagered;
    const kaibuxWon = (userWagerType === "KAIBUX" ? 1200 : 0) + (opWagerType === "KAIBUX" ? 1200 : 0);
    const currStars = starWalletBalance;
    const kaibux = kaibuxBalance;
    const newStarBalance = starsWon + currStars;
    const newkaibuxBalance = kaibux + kaibuxWon;

    console.log("Stars Won: ", starsWon, "\ncurrStars: " + currStars + "\nNew Balance: " + newStarBalance );
    console.log("kaibux Won: ", kaibuxWon, "\ncurrkaibux: " + kaibux + "\nNew Balance: " + newkaibuxBalance );
    setStarWalletBalance(newStarBalance); 
    setKaibuxBalance(newkaibuxBalance);
    await AsyncStorage.setItem(USER_STAR_BALANCE, String(newStarBalance))
    await AsyncStorage.setItem(USER_KAIBUX_BALANCE, String(newkaibuxBalance))

    showAlert("You won"); 
    (navigation.navigate as any)('Welcome');
  }

  //checks to see if the game ended through depletion of lifepoints
  useEffect(() => {
    if (lifePoints <= 0 && !duelEnded) {
      setDuelEnded(true);
      handleEndDuel();
    }
  }, [lifePoints, duelEnded]);

  return (
    <View style={styles.container}>
      {/* Center: lifepoints */}
      <View style={styles.centerContent}>
        <Text style={styles.lpLabel}>YOUR LIFEPOINTS</Text>
        <Text style={styles.lpValue}>{lifePoints}</Text>

        <View style={styles.lpButtonRow}>
          <TouchableOpacity
            style={styles.lpBtn}
            activeOpacity={0.8}
            onPress={() => openLifePointsModal('subtract')}
          >
            <Text style={styles.lpBtnText}>−</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.lpBtn}
            activeOpacity={0.8}
            onPress={() => openLifePointsModal('add')}
          >
            <Text style={styles.lpBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.coinFlipBtn}
          activeOpacity={0.8}
          onPress={() => setCoinFlipModalVisible(true)}
        >
          <Text style={styles.wagerBtnText}>COIN FLIP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.coinFlipBtn}
          activeOpacity={0.8}
          onPress={() => setDiceModalVisible(true)}
        >
          <Text style={styles.wagerBtnText}>DICE ROLL</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom-left: settings / forfeit */}
      <TouchableOpacity
        style={styles.settingsBtn}
        activeOpacity={0.8}
        onPress={() => setSettingsModalVisible(true)}
      >
        <Text style={styles.settingsIcon}>⚙</Text>

        
      </TouchableOpacity>

      {/* Win Game Button */}
      <TouchableOpacity
        style={styles.Win}
        activeOpacity={0.8}
        onPress={() => handleWin()}
      >
        <Text style={styles.settingsIcon}>WIN GAME</Text>
      </TouchableOpacity>

      {/* Lifepoints Modal */}
      <Modal
        visible={lifePointsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeLifePointsModal}
        supportedOrientations={['landscape']}
      >
        <Pressable style={styles.overlay} onPress={closeLifePointsModal}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>
                {lifePointsAction === 'add' ? 'ADD LIFEPOINTS' : 'SUBTRACT LIFEPOINTS'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Current: <Text style={styles.highlight}>{lifePoints}</Text> LP
              </Text>

              <TextInput
                style={styles.input}
                value={lifePointsInput}
                onChangeText={setLifePointsInput}
                placeholderTextColor="#8f86b3"
                keyboardType="number-pad"
                autoFocus
                maxLength={6}
              />

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  activeOpacity={0.8}
                  onPress={closeLifePointsModal}
                >
                  <Text style={styles.wagerBtnText}>CANCEL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.confirmBtn]}
                  activeOpacity={0.8}
                  onPress={confirmLifePoints}
                >
                  <Text style={styles.wagerBtnText}>CONFIRM</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Coin Flip Modal */}
      <Modal
        visible={coinFlipModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCoinFlipModalVisible(false)}
        supportedOrientations={['landscape']}
      >
        <Pressable style={styles.overlay} onPress={() => setCoinFlipModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>COIN FLIP</Text>
            <Text style={styles.modalSubtitle}>{flipCoin()}</Text>
            <TouchableOpacity
              style={[styles.modalBtn, styles.confirmBtn]}
              activeOpacity={0.8}
              onPress={() => setCoinFlipModalVisible(false)}
            >
              <Text style={styles.wagerBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      
      {/* Dice Roll Modal */}
      <Modal
        visible={diceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDiceModalVisible(false)}
        supportedOrientations={['landscape']}
      >
        <Pressable style={styles.overlay} onPress={() => setDiceModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>DICE ROLL</Text>
            <Text style={styles.modalSubtitle}>{rollDice()}</Text>
            <TouchableOpacity
              style={[styles.modalBtn, styles.confirmBtn]}
              activeOpacity={0.8}
              onPress={() => setDiceModalVisible(false)}
            >
              <Text style={styles.wagerBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsModalVisible(false)}
        supportedOrientations={['landscape']}
      >
        <Pressable style={styles.overlay} onPress={() => setSettingsModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>SETTINGS</Text>

            <TouchableOpacity
              style={[styles.modalBtn, styles.forfeitBtn]}
              activeOpacity={0.8}
              onPress={handleForfeit}
            >
              <Text style={styles.wagerBtnText}>FORFEIT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, styles.cancelBtn, { marginTop: 12 }]}
              activeOpacity={0.8}
              onPress={() => setSettingsModalVisible(false)}
            >
              <Text style={styles.wagerBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(37, 28, 78)',
    padding: 16,
  },

  /* Top-left readout */
  Win: {
    position: 'absolute',
    top: 26,
    right: 36,
    gap: 4,
    backgroundColor: '#9A416F',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgb(255, 230, 0)',
  },

  topRight: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 4,
  },
  chipsText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'mainFont',
  },
  highlight: {
    color: 'rgb(255, 230, 0)',
    fontWeight: 'bold',
  },

  /* Center content */
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lpLabel: {
    color: '#c7d3e0',
    fontSize: 14,
    letterSpacing: 4,
    fontFamily: 'mainFont',
    marginBottom: 4,
  },
  lpValue: {
    color: '#ffffff',
    fontSize: 48,
    fontFamily: 'mainFont',
    marginBottom: 16,
  },
  lpButtonRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  lpBtn: {
    width: 48,
    height: 48,
    borderWidth: 1.5,
    borderColor: 'rgb(255, 230, 0)',
    backgroundColor: '#9A416F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lpBtnText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'altFont',
  },
  coinFlipBtn: {
    backgroundColor: '#9A416F',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgb(255, 230, 0)',
  },
  wagerBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'altFont',
  },

  /* Bottom-left settings */
  settingsBtn: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgb(255, 230, 0)',
    backgroundColor: '#9A416F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    color: '#ffffff',
    fontSize: 20,
  },

  /* Modal */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 280,
    backgroundColor: 'rgb(37, 28, 78)',
    borderWidth: 1.5,
    borderColor: 'rgb(255, 230, 0)',
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'mainFont',
    letterSpacing: 2,
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'mainFont',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#9A416F',
    color: 'black',
    backgroundColor: '#ffffff',
    fontSize: 20,
    fontFamily: 'mainFont',
    textAlign: 'center',
    paddingVertical: 8,
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgb(255, 230, 0)',
  },
  cancelBtn: {
    backgroundColor: 'transparent',
  },
  confirmBtn: {
    backgroundColor: '#9A416F',
  },
  forfeitBtn: {
    backgroundColor: '#7a1f1f',
    borderColor: '#ff6b6b',
  },
});
