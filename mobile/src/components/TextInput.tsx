import React from 'react';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';

interface TextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  mode?: 'flat' | 'outlined';
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error = false,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  left,
  right,
  style,
  mode = 'outlined',
}) => {
  return (
    <PaperTextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      error={error}
      disabled={disabled}
      multiline={multiline}
      numberOfLines={numberOfLines}
      left={left}
      right={right}
      style={style}
      mode={mode}
    />
  );
};
