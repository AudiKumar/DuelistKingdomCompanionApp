//TODO: welcome modal that asks the user for their given information. Name and User Name Mostly, maybe a profile picture for the fun of it
import React, { useState } from 'react';
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

export default function WelcomeScreen() {
   const navigation = useNavigation();
  // TODO: wire these up to real player data
  const [playerName] = useState('PLAYER NAME (INSERT REAL DATA HERE)');
  const [wallet, setWallet] = useState(10);

  const [wagerModalVisible, setWagerModalVisible] = useState(false);
  const [wagerInput, setWagerInput] = useState('');

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

  function confirmWager() { // TODO: maybe wagering your best card // this would be a last condition. 
    const amount = Number(wagerInput);

    if (!wagerInput.trim() || Number.isNaN(amount)) {
      showAlert('Enter a valid number of stars to wager.');
      return;
    }
    if (amount <= 0) {
      showAlert('Your wager has to be at least 1 star.');
      return;
    }
    if (amount > wallet) {
      showAlert("You don't have enough stars for that wager.");
      return;
    }

    // TODO: actually kick off the duel with this wager amount
    setWallet((prev) => prev - amount);
    setWagerModalVisible(false);
    showAlert(`Wagered ${amount} stars. Good luck!`);

    (navigation.navigate as any)("Duel"); 
  }

  return (
    <View style={styles.container}>
      <Text style={styles.statText} numberOfLines={1}>
        {playerName}
      </Text>

      {/* Wallet & Wager Display */}
      <View style={styles.statsContainer}>
        <Text style={styles.statText}>
          Wallet: <Text style={styles.highlight}>{wallet}</Text> Stars
        </Text>
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

      {/* Wager Modal */}
      <Modal
        visible={wagerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeWagerModal}
      >
        <Pressable style={styles.overlay} onPress={closeWagerModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Stop taps inside the card from closing the modal */}
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>PLACE YOUR WAGER</Text>
              <Text style={styles.modalSubtitle}>
                Wallet: <Text style={styles.highlight}>{wallet}</Text> Stars
              </Text>

              <TextInput // TODO: this could probably be changed to a plus and minus button 
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
                  onPress={confirmWager}
                >
                  <Text style={styles.wagerBtnText}>CONFIRM</Text>
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