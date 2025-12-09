import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';

export default function SandboxScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 py-4 border-b border-border-subtle flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-accent text-base">Back</Text>
        </TouchableOpacity>
        <Text className="text-text-primary text-lg font-semibold ml-4">
          UI Sandbox
        </Text>
      </View>
      
      <ScrollView className="flex-1" contentContainerStyle={styles.scrollContent}>
        <View style={styles.outerContainer}>
          <View style={styles.phoneFrame}>
            {/* Navigation/Footer Bar */}
            <View style={styles.navBar}>
              <View style={styles.buttonWrapper}>
                {/* Neumorphic Button - Using layered Views for the effect */}
                <View style={styles.neumorphicContainer}>
                  {/* Dark shadow layer (bottom-right) */}
                  <View style={styles.darkShadowLayer} />
                  {/* Light shadow layer (top-left) */}
                  <View style={styles.lightShadowLayer} />
                  {/* Main button */}
                  <View style={styles.neumorphicButton}>
                    {/* Content of the button */}
                    <View style={styles.buttonContent}>
                      {/* SVG Icon */}
                      <Svg width={16} height={16} style={styles.svgIcon}>
                        <Circle cx={8} cy={8} r={8} fill="#FF6467" />
                      </Svg>
                      <Text style={styles.buttonText}>Record moment</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  outerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0', // bg-zinc-200
    borderTopWidth: 1,
    borderColor: '#D4D4D4', // border-stone-300
  },
  phoneFrame: {
    width: 350,
    height: 610,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#09090b',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#18181B', // bg-zinc-900 for phone frame background
  },
  navBar: {
    position: 'absolute',
    left: 0,
    top: 509,
    width: 346,
    height: 101,
    backgroundColor: '#18181B', // bg-zinc-900
    paddingHorizontal: 0,
    paddingTop: 2,
    paddingBottom: 3,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
  },
  buttonWrapper: {
    flexGrow: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 6,
    backgroundColor: '#E0E0E0', // bg-zinc-200
  },
  neumorphicContainer: {
    width: 216,
    height: 45,
    position: 'relative',
  },
  darkShadowLayer: {
    position: 'absolute',
    left: 4,
    top: 0,
    width: 216,
    height: 45,
    borderRadius: 999,
    backgroundColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lightShadowLayer: {
    position: 'absolute',
    left: -6,
    top: -6,
    width: 216, // 216 + 8 (4px on each side)
    height: 53, // 45 + 8 (4px on each side)
    borderRadius: 999,
    backgroundColor: 'transparent',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 2,
    elevation: 2,
  },
  neumorphicButton: {
    backgroundColor: '#E0E0E0', // bg-zinc-200
    borderRadius: 999, // rounded-full
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderTopWidth: 1,
    borderBottomWidth: 0,
    borderLeftWidth: 1,
    borderRightWidth: 0,
    width: 216,
    height: 45,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 10,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'absolute',
    left: 29,
    top: 11,
    gap: 8,
    zIndex: 20,
  },
  svgIcon: {
    marginRight: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#3F3F46', // text-zinc-700
  },
});



//v2 attempt below

import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Gradient from '../components/Gradient';
import { useTheme } from '@hooks/useTheme';

export default function SandboxScreen() {
  const navigation = useNavigation();
  const { shadows } = useTheme();

  return (
    <Gradient name="surface-metal" className="flex-1 justify-center items-center p-8">
        <View className="flex-1 w-full justify-center items-center rounded-xl bg-surface-inverted dark:zinc-700 mt-12 p-1">
            <View className="flex-1 w-full rounded-lg bg-surface-inverted dark:bg-surface-inverted justify-top items-center mb-1 p-5">
                <Text className="text-sm uppercase text-accent-orange dark:text-accent-orange font-semibold">Today's prompt</Text>
                <Text className="text-3xl text-text-inverse dark:text-text-inverse font-semibold text-center pt-5">Tell me one thing that made you laugh today?</Text>
            </View>
            <Gradient name="surface-metal" className="flex-1 w-full rounded-lg overflow-hidden justify-center items-center mb-1 p-1">
                <View className="flex-row justify-center items-center">
                    <View className="w-4 h-4 bg-surface-inverted dark:bg-surface-inverted rounded-full m-1" style={{ boxShadow: shadows.metalInner }}></View>
                    <View className="w-4 h-4 bg-surface-inverted dark:bg-surface-inverted rounded-full m-1" style={{ boxShadow: shadows.metalInner }}></View>
                    <View className="w-4 h-4 bg-surface-inverted dark:bg-surface-inverted rounded-full m-1" style={{ boxShadow: shadows.metalInner }}></View>
                    <View className="w-4 h-4 bg-surface-inverted dark:bg-surface-inverted rounded-full m-1" style={{ boxShadow: shadows.metalInner }}></View>
                </View>
                <View className="flex-row justify-center items-center">
                    <View className="w-4 h-4 bg-surface-inverted dark:bg-surface-inverted rounded-full m-1" style={{ boxShadow: shadows.metalInner }}></View>
                    <View className="w-4 h-4 bg-surface-inverted dark:bg-surface-inverted rounded-full m-1" style={{ boxShadow: shadows.metalInner }}></View>
                    <View className="w-4 h-4 bg-surface-inverted dark:bg-surface-inverted rounded-full m-1" style={{ boxShadow: shadows.metalInner }}></View>
                    <View className="w-4 h-4 bg-surface-inverted dark:bg-surface-inverted rounded-full m-1" style={{ boxShadow: shadows.metalInner }}></View>
                </View>
                <View className="flex-row justify-center items-center">
                    <View className="w-4 h-4 bg-surface-inverted dark:bg-surface-inverted rounded-full m-1" style={{ boxShadow: shadows.metalInner }}></View>
                    <View className="w-4 h-4 bg-surface-inverted dark:bg-surface-inverted rounded-full m-1" style={{ boxShadow: shadows.metalInner }}></View>
                    <View className="w-4 h-4 bg-surface-inverted dark:bg-surface-inverted rounded-full m-1" style={{ boxShadow: shadows.metalInner }}></View>
                    <View className="w-4 h-4 bg-surface-inverted dark:bg-surface-inverted rounded-full m-1" style={{ boxShadow: shadows.metalInner }}></View>
                </View>
                <View className="flex-row justify-center items-center">
                    <View className="w-4 h-4 bg-surface-inverted dark:bg-surface-inverted rounded-full m-1" style={{ boxShadow: shadows.metalInner }}></View>
                    <View className="w-4 h-4 bg-surface-inverted dark:bg-surface-inverted rounded-full m-1" style={{ boxShadow: shadows.metalInner }}></View>
                    <View className="w-4 h-4 bg-surface-inverted dark:bg-surface-inverted rounded-full m-1" style={{ boxShadow: shadows.metalInner }}></View>
                    <View className="w-4 h-4 bg-surface-inverted dark:bg-surface-inverted rounded-full m-1" style={{ boxShadow: shadows.metalInner }}></View>
                </View>
            </Gradient>
            <Gradient name="surface-metal" className="w-full rounded-lg overflow-hidden justify-center items-center p-5">
                <View 
                  className="rounded-full" 
                  style={{ 
                    boxShadow: shadows.neumorphic 
                  }}
                  >
                    <Gradient name="button-border" className='justify-center items-center p-0.5 overflow-hidden rounded-full'>
                        <Gradient name="surface-metal" className="flex-row justify-center rounded-full overflow-hidden py-6 px-10 items-center">
                            <View className="w-6 h-6 mr-3 bg-accent-orange dark:bg-accent-orange-dark rounded-full"></View>
                            <Text className="text-lg text-text-primary dark:text-text-secondary-dark font-semibold">Record Moment</Text>
                        </Gradient>
                    </Gradient>
                </View>
             </Gradient>
        </View>
    </Gradient>
  );
}