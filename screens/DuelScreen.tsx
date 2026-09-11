//TODO: pull wagered chips, wallet, and starting lifepoints from real game/navigation state
import React, { useState, useEffect} from 'react';
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
import AsyncStorage from "@react-native-async-storage/async-storage";

type LifePointAction = 'add' | 'subtract' | null;

const USER_STARS_WAGERED = "@user_stars_wagered"
const OP_STARS_WAGERED = "@op_stars_wagered"
const USER_STAR_BALANCE = "@dk_star_wallet";

export default function DuelScreen() {

  const [opStarsWaged, setOpStarsWaged] = useState(0);
  const [userStarsWaged, setUserStarsWaged] = useState(0);
  const [starWalletBalance, setStarWalletBalance] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const opStar = await AsyncStorage.getItem(USER_STARS_WAGERED); 
        const userStar = await AsyncStorage.getItem(OP_STARS_WAGERED);
        const stars = await AsyncStorage.getItem(USER_STAR_BALANCE);

        setOpStarsWaged(Number(opStar)); 
        setUserStarsWaged(Number(userStar)); 
        setStarWalletBalance(Number(stars)); 
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

  function confirmLifePoints() {
    const amount = Number(lifePointsInput);

    if (!lifePointsInput.trim() || Number.isNaN(amount) || amount <= 0) {
      showAlert('Enter a valid number of lifepoints.');
      return;
    }

    setLifePoints((prev) =>
      lifePointsAction === 'add' ? prev + amount : Math.max(0, prev - amount)
    );
    closeLifePointsModal();
  }

  function handleForfeit() {
    setSettingsModalVisible(false);
    showAlert('You forfeited the duel.');
    (navigation.navigate as any)('Welcome');
  }

  async function handleWin() {
    console.log("Handle win")
    const starsWon = opStarsWaged + userStarsWaged;
    const currStars = starWalletBalance
    const newBalance = starsWon + currStars; 

    console.log("Stars Won: ", starsWon, "\ncurrStars: " + currStars + "\nNew Balance: " + newBalance )
    setStarWalletBalance(newBalance); 
    await AsyncStorage.setItem(USER_STAR_BALANCE, String(newBalance))

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
