
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KAIBUX_BALANCE = '@dk_kaibux';
const USER_STAR_BALANCE = "@dk_star_wallet";

type BalanceAction = 'add' | 'subtract' | null;

export default function UpdateBalanceScreen() {
  const navigation = useNavigation();

  const [kaibuxBalance, setKaibuxBalance] = useState<number>(500);
  const [starWalletBalance, setStarWalletBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [balanceAction, setBalanceAction] = useState<BalanceAction>(null);
  const [balanceInput, setBalanceInput] = useState('');

  // load the stored balance on mount
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const kaibux = await AsyncStorage.getItem(USER_KAIBUX_BALANCE);
        const stars = await AsyncStorage.getItem(USER_STAR_BALANCE);
        if (!isMounted) return;
        setKaibuxBalance(Number(kaibux));
        setStarWalletBalance(Number(stars));
      } catch (error) {
        console.error('Failed to read kaibux and or starwallet balance from AsyncStorage', error);
      } finally {
        if (isMounted) setIsLoadingBalance(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  function showAlert(message: string) {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert(message);
    }
  }



  function openBalanceModal(action: BalanceAction) {
    setBalanceAction(action);
    setBalanceInput('');
    setBalanceModalVisible(true);
  }

  function closeBalanceModal() {
    setBalanceModalVisible(false);
    setBalanceAction(null);
  }

  async function persistBalance(newBalance: number) {
    try {
      await AsyncStorage.setItem(USER_KAIBUX_BALANCE, String(newBalance));
    } catch (error) {
      console.error('Failed to save kaibux balance to AsyncStorage', error);
    }
  }

  async function confirmBalanceChange() {
    const amount = Number(balanceInput);

    if (!balanceInput.trim() || Number.isNaN(amount) || amount <= 0) {
      showAlert('Enter a valid number of kaibux.');
      return;
    }

    if (balanceAction === 'subtract' && amount > kaibuxBalance) {
      showAlert("You don't have enough kaibux for that.");
      return;
    }

    const newBalance =
      balanceAction === 'add'
        ? kaibuxBalance + amount
        : kaibuxBalance - amount;

    setKaibuxBalance(newBalance);
    await persistBalance(newBalance);
    closeBalanceModal();
  }

  function handleDone() {
    (navigation.navigate as any)('Welcome');
  }

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
       <View style={styles.centerContent}>
        {/* Kaibux Balance */}
        <View style={styles.lpButtonRow}>
          <Text style={styles.lpLabel}>KAIBUX BALANCE</Text>
          <Text style={styles.lpValue}>
            {isLoadingBalance ? '—' : kaibuxBalance}
          </Text>

          <TouchableOpacity
            style={styles.lpBtn}
            activeOpacity={0.8}
            onPress={() => openBalanceModal('subtract')}
          >
            <Text style={styles.lpBtnText}>−</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.lpBtn}
            activeOpacity={0.8}
            onPress={() => openBalanceModal('add')}
          >
            <Text style={styles.lpBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        
        {/* Stars Balance */}
        <View style={styles.lpButtonRow}>

          <Text style={styles.lpLabel}>STARS BALANCE</Text>
          <Text style={styles.lpValue}>
            {isLoadingBalance ? '—' : starWalletBalance}
          </Text>

          <TouchableOpacity
            style={styles.lpBtn}
            activeOpacity={0.8}
            onPress={() => openBalanceModal('subtract')}
          >
            <Text style={styles.lpBtnText}>−</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.lpBtn}
            activeOpacity={0.8}
            onPress={() => openBalanceModal('add')}
          >
            <Text style={styles.lpBtnText}>+</Text>
          </TouchableOpacity>
        </View>


        {/* DONE BUTTON */}
        <TouchableOpacity
          style={styles.doneBtn}
          activeOpacity={0.8}
          onPress={handleDone}
        >
          <Text style={styles.wagerBtnText}>DONE</Text>
        </TouchableOpacity>
      </View>
      </View>

      {/* Balance Adjustment Modal */}
      <Modal
        supportedOrientations={['landscape']}
        visible={balanceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeBalanceModal}
      >
        <Pressable style={styles.overlay} onPress={closeBalanceModal}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>
                {balanceAction === 'add' ? 'ADD kaibux' : 'SUBTRACT kaibux'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Current: <Text style={styles.highlight}>{kaibuxBalance}</Text> kaibux
              </Text>

              <TextInput
                style={styles.input}
                value={balanceInput}
                onChangeText={setBalanceInput}
                placeholderTextColor="#8f86b3"
                keyboardType="number-pad"
                autoFocus
                maxLength={6}
              />

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  activeOpacity={0.8}
                  onPress={closeBalanceModal}
                >
                  <Text style={styles.wagerBtnText}>CANCEL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.confirmBtn]}
                  activeOpacity={0.8}
                  onPress={confirmBalanceChange}
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
    padding: 16,
  },

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
    alignItems: 'center',
    alignSelf: 'center'
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
  doneBtn: {
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
  highlight: {
    color: 'rgb(255, 230, 0)',
    fontWeight: 'bold',
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
});