import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';  

// screen navigation packages
import { createStaticNavigation, StaticParamList } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import StartScreen from './screens/StartScreen';
import DuelScreen from './screens/DuelScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import UpdateBalanceScreen from './screens/UpdateBalanceScreen'


//TODO
/* 
Dice rolling 
Kaibucks add it 
Some manner of adding credits via either debug menu or nfc tags (stretch goal)
Rule button on duel screen 
*/


export const RootStack = createNativeStackNavigator({
  screens: {
    Start: {
      screen: StartScreen,
      options: {
        title: "", 
        headerTransparent: true, 
        headerStyle: {
          backgroundColor: '#00000000', 
        }
      },
    },

    Duel: {
      screen: DuelScreen,
      options: {
        title: "", 
        headerShown: false,
        headerTransparent: true, 
        headerStyle: {
          backgroundColor: '#00000000', 
        }
      },
    },

    Welcome: {
      screen: WelcomeScreen,
      options: {
        title: "", 
        headerShown: false,
        headerTransparent: true, 
        headerStyle: {
          backgroundColor: '#00000000', 
        }
      },
    },
    UpdateBalance: {
      screen: UpdateBalanceScreen,
        options: {
        title: "", 
        headerTransparent: true, 
        headerStyle: {
          backgroundColor: '#00000000', 
        }
      },
    }

  }
});

const Navigation = createStaticNavigation(RootStack);

export default function App() {

  return <Navigation />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});