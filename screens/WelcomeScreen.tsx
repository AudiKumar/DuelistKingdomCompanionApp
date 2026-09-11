//TODO: welcome modal that asks the user for their given information. Name and User Name Mostly, maybe a profile picture for the fun of it
import React, { useState, useEffect } from 'react';
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

const USER_NAME_KEY = "@duelist_kingdom_user_name";
const USER_STAR_BALANCE = "@dk_star_wallet";
const USER_KAIBUCKS_BALANCE = "@dk_kaibucks";
const USER_WAGER_TYPE = "@user_wager_type";
const USER_STARS_WAGERED = "@user_stars_wagered";
const OP_WAGER_TYPE = "@op_wager_type";

export type WagerType = "STARS" | "KAIBUX" | "CARD" | null;


export default function WelcomeScreen() {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [starWalletBalance, setStarWalletBalance] = useState<number>(0);
  const [kaibaBucks, setKaibaBucksBalance] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const storedName = await AsyncStorage.getItem(USER_NAME_KEY);
        const stars = await AsyncStorage.getItem(USER_STAR_BALANCE);
        const money = await AsyncStorage.getItem(USER_KAIBUCKS_BALANCE)
        setPlayerName(storedName);
        const parsedWallet = stars != null ? Number(stars) : NaN;
        const parsedKaibucks = money != null ? Number(money): NaN; 
        setStarWalletBalance(Number.isFinite(parsedWallet) ? parsedWallet : 10);
        setKaibaBucksBalance(Number.isFinite(parsedKaibucks) ? parsedKaibucks : 500);      
      } catch (error) {
        console.error("Failed to read user name from AsyncStorage", error);
      }
    })();
  }, [])
   const navigation = useNavigation();

  const [wagerModalVisible, setWagerModalVisible] = useState(false);
  const [wagerInput, setWagerInput] = useState('');
  const [opWagerTypeInput, setOpWagerTypeInput] = useState<WagerType>(null);
  const [opWagerModalVisible, setOpWagerModalVisible] = useState(false);
  

  function showAlert(message: string) {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert(message);
    }
  }

  function openWagerModal() {
    setWagerInput('');
    setWagerModalVisible(true);
  }

  function closeWagerModal() {
    setWagerModalVisible(false);
  }

  async function confirmUserWager() { // TODO: maybe wagering your best card // this would be a last condition. 
    const amount = Number(wagerInput);

    if (!wagerInput.trim() || Number.isNaN(amount)) {
      showAlert('Enter a valid number of stars to wager.');
      return;
    }
    if (amount <= 0) {
      showAlert('Your wager has to be at least 1 star.');
      return;
    }
    if (amount > starWalletBalance) {
      showAlert("You don't have enough stars for that wager.");
      return;
    }

    const newBalance = starWalletBalance - amount;

    try {
      await AsyncStorage.setItem(USER_WAGER_TYPE, "STARS");
    } catch (error) {
      console.error("Failed to save user wager type to Async Storage")
    }

    try {
      await AsyncStorage.setItem(USER_STARS_WAGERED, String(amount))
    } catch (error) {
      console.error("Failed to save amount bet to Async Storage")
    }

    setStarWalletBalance(newBalance); // this would be needed because you need to add this back
    try {
      await AsyncStorage.setItem(USER_STAR_BALANCE, String(newBalance));
    } catch (error) {
      console.error("Failed to save wallet balance to AsyncStorage", error);
    }

    setWagerModalVisible(false);
    //showAlert(`Wagered ${amount} stars. Good luck!`);
    setOpWagerModalVisible(true);
    
  }


  useEffect(() => {
    if (opWagerTypeInput !== null) {
      try {
        AsyncStorage.setItem(OP_WAGER_TYPE, String(opWagerTypeInput));
      } catch (error) {
        console.error("Failed to save opponent wager type to AsyncStorage", error);
      }
      setOpWagerModalVisible(false);
      (navigation.navigate as any)("Duel");
    }
  }, [opWagerTypeInput]);

  function goToUpdateBalance() {
    (navigation.navigate as any)("UpdateBalance");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.statText} numberOfLines={1}>
        Welcome {playerName}
      </Text>

      {/* Wallet & Wager Display */}
      <View style={styles.statsContainer}>
        <Text style={styles.statText}>
          Stars: <Text style={styles.highlight}>{starWalletBalance}</Text>
        </Text>
        <Text style = {styles.statText}> Wallet Balance: {kaibaBucks} Kaibucks</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.wagerBtn}
          activeOpacity={0.8}
          onPress={openWagerModal}
        >
          <Text style={styles.wagerBtnText}>WAGER</Text>
        </TouchableOpacity>
      </View>

        <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.wagerBtn}
          activeOpacity={0.8}
          onPress={goToUpdateBalance}
        >
          <Text style={styles.wagerBtnText}>UPDATE BALANCE</Text>
        </TouchableOpacity>
        </View>

      {/* Wager Modal */}
      <Modal
        visible={wagerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeWagerModal}
        supportedOrientations={['landscape']}
      >
        <Pressable style={styles.overlay} onPress={closeWagerModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Stop taps inside the card from closing the modal */}
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>PLACE YOUR WAGER</Text>
              <Text style={styles.modalSubtitle}>
                Star Balance: <Text style={styles.highlight}>{starWalletBalance}</Text> Stars
              </Text>

              <TextInput
                style={styles.input}
                value={wagerInput}
                onChangeText={setWagerInput}
                placeholderTextColor="#8f86b3"
                keyboardType="number-pad"
                autoFocus
                maxLength={6}
              />

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  activeOpacity={0.8}
                  onPress={closeWagerModal}
                >
                  <Text style={styles.wagerBtnText}>CANCEL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.confirmBtn]}
                  activeOpacity={0.8}
                  onPress={confirmUserWager}
                >
                  <Text style={styles.wagerBtnText}>CONFIRM</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Opponent Wager Modal */}
      <Modal
        visible={opWagerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={ ()=> setOpWagerModalVisible(false) }
        supportedOrientations={['landscape']}
      >
        <Pressable style={styles.overlay} onPress={() => setOpWagerModalVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Stop taps inside the card from closing the modal */}
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>ENEMY WAGER</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.wagerBtn}
                  activeOpacity={0.8}
                  onPress={() => setOpWagerTypeInput("STARS")}
                >
                  <Text style={styles.wagerBtnText}>STARS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.wagerBtn}
                  activeOpacity={0.8}
                  onPress={() => setOpWagerTypeInput("KAIBUX")}
                >
                  <Text style={styles.wagerBtnText}>KAIBUX</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.wagerBtn}
                  activeOpacity={0.8}
                  onPress={() => setOpWagerTypeInput("CARD")}
                >
                  <Text style={styles.wagerBtnText}>CARD</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  activeOpacity={0.8}
                  onPress={() => setOpWagerModalVisible(false)}
                >
                  <Text style={styles.wagerBtnText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(37, 28, 78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  statsContainer: {
    marginBottom: 32,
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'mainFont',
  },
  highlight: {
    color: 'rgb(255, 230, 0)',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  wagerBtn: {
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
    backgroundColor:'#ffffff',
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
});