import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Gradient from '../components/Gradient';
import { useTheme } from '@hooks/useTheme';
import { Icon } from '../components/Icon';
import { ShadowBox } from '../components/ShadowBox';



export default function SandboxScreen() {
  const navigation = useNavigation();
  const { shadows } = useTheme();

  return (
    <View className="flex-1 justify-center items-center bg-surface dark:bg-surface-dark p-6">
         <Text className="text-text-muted dark:text-text-muted-dark font-bold text-md mb-4">5th Dec 2025</Text>
         <Text className="text-text-primary dark:text-text-primary-dark font-serif-semibold text-center text-4xl leading-tight tracking-tighter mb-10">Tell me one thing that made you laugh today</Text>
         <View className="w-full flex-row items-center justify-center h-20 border-2 border-border-button-primary dark:border-border-button-primary-dark bg-button-primary dark:bg-button-primary-dark p-1.5 rounded-full" 
         style={{ boxShadow: shadows.buttonPrimary }}>
            <Gradient name="button-primary-fill" className="flex-1 h-full flex-row items-center justify-center rounded-full overflow-hidden" >
                <View className="flex-row items-center justify-center">
                    <View className="w-6 h-6 mr-3 bg-text-button-primary dark:bg-text-button-primary-dark rounded-full"></View>
                    <Text className="text-text-primary text-center font-semibold text-lg tracking-tight text-text-button-primary">Record</Text>
                </View>
            </Gradient>
         </View>
         
      {/* Version 2: Photo Add Button Card */}
      <ShadowBox shadowSize="cardLarge" className="mt-10">
        <Gradient 
          name="surface-card"
          className="w-[208px] h-[208px]"
          style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 12, paddingBottom: 48 }}
        >
          {/* Inner container with gradient effect */}
          <Gradient 
            name="surface-card-inner" 
            className="flex-1 self-stretch justify-center items-center"
            style={{ gap: 8 }}
          >
            {/* Icon and Text Container */}
            <View className="items-center" style={{ width: 79, gap: 6 }}>
              <Icon 
                name="ic-add" 
                size={24} 
                color="textMuted" 
              />
              <Text 
                className="text-center text-text-muted dark:text-text-muted-dark"
                style={{ 
                  width: 79, 
                  fontSize: 16
                }}
              >
                Add photo
              </Text>
            </View>
          </Gradient>
        </Gradient>
      </ShadowBox>
    </View>
  );
}