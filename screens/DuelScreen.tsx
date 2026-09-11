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

type LifePointAction = 'add' | 'subtract' | null;

export default function DuelScreen() {
  const navigation = useNavigation();

  // TODO: wire these up to real data (likely passed in via navigation params
  // from the WelcomeScreen wager flow)
  const [wageredChips] = useState(0); //TODO: Pipe in real data
  const [wallet] = useState(10); //TODO: Pipe in real data
  const [lifePoints, setLifePoints] = useState(6000); 
  const [duelEnded, setDuelEnded] = useState(false); // this is for when the duel has ended by the user's life points have been depleted
  const [lifePointsModalVisible, setLifePointsModalVisible] = useState(false);
  const [lifePointsAction, setLifePointsAction] = useState<LifePointAction>(null);
  const [lifePointsInput, setLifePointsInput] = useState('');

  const [coinFlipModalVisible, setCoinFlipModalVisible] = useState(false);
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
    // TODO: real forfeit logic (record loss, clear wager, etc.)
    showAlert('You forfeited the duel.');
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
      {/* Top-left: wager & wallet readout */}
      <View style={styles.topLeft}>
        <Text style={styles.chipsText} numberOfLines={1}>
          Wagered: <Text style={styles.highlight}>{wageredChips}</Text> Chips
        </Text>

      </View>
      <View style={styles.topRight}> 
        <Text style={styles.chipsText} numberOfLines={1}>
          Wallet: <Text style={styles.highlight}>{wallet}</Text> Stars
        </Text>
      </View>

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
      </View>

      {/* Bottom-left: settings / forfeit */}
      <TouchableOpacity
        style={styles.settingsBtn}
        activeOpacity={0.8}
        onPress={() => setSettingsModalVisible(true)}
      >
        <Text style={styles.settingsIcon}>⚙</Text>
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

      {/* Coin Flip Modal (placeholder) */}
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
            <Text style={styles.modalSubtitle}>TODO</Text>

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
  topLeft: {
    position: 'absolute',
    top: 16,
    left: 16,
    gap: 4,
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
