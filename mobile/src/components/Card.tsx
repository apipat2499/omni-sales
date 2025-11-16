import React from 'react';
import { Card as PaperCard } from 'react-native-paper';
import { StyleProp, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  elevation?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevation = 1,
}) => {
  return (
    <PaperCard
      style={style}
      onPress={onPress}
      elevation={elevation}
    >
      {children}
    </PaperCard>
  );
};

Card.Content = PaperCard.Content;
Card.Title = PaperCard.Title;
Card.Cover = PaperCard.Cover;
Card.Actions = PaperCard.Actions;
