import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image, Modal } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
  OverlayContainer,
  SuccessText,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const { setOptions, goBack } = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const { data } = await api.get<Food>(`foods/${routeParams.id}`);

      setFood({
        ...data,
        formattedPrice: formatValue(data.price),
      });

      setExtras(
        data.extras.map(extra => ({
          ...extra,
          quantity: 0,
        })),
      );
    }

    loadFood();
  }, [routeParams]);

  useEffect(() => {
    async function checkIsFoodFavorite(): Promise<void> {
      try {
        const { data } = await api.get<Food>(`favorites/${routeParams.id}`);

        if (data) {
          setIsFavorite(true);
        }
      } catch (err) {
        setIsFavorite(false);
      }
    }

    checkIsFoodFavorite();
  }, [routeParams.id]);

  const handleIncrementExtra = useCallback(
    (id: number) => {
      const newExtras = extras.map(extra =>
        extra.id === id ? { ...extra, quantity: extra.quantity + 1 } : extra,
      );

      setExtras(newExtras);
    },
    [extras],
  );

  const handleDecrementExtra = useCallback(
    (id: number) => {
      const newExtras = extras.map(extra => {
        if (extra.id === id && extra.quantity > 0) {
          return {
            ...extra,
            quantity: extra.quantity - 1,
          };
        }

        return extra;
      });

      setExtras(newExtras);
    },
    [extras],
  );

  const handleIncrementFood = useCallback(() => {
    setFoodQuantity(oldQuantity => oldQuantity + 1);
  }, []);

  const handleDecrementFood = useCallback(() => {
    if (foodQuantity > 1) {
      setFoodQuantity(oldQuantity => oldQuantity - 1);
    }
  }, [foodQuantity]);

  const toggleFavorite = useCallback(() => {
    if (isFavorite) {
      api.delete(`favorites/${food.id}`);
    } else {
      api.post('favorites', food);
    }

    setIsFavorite(!isFavorite);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const foodTotal = food.price * foodQuantity;

    const extraTotal = extras.reduce(
      (total, extra) => total + extra.value * extra.quantity,
      0,
    );

    const total = foodTotal + extraTotal * foodQuantity;

    return formatValue(total);
  }, [extras, food, foodQuantity]);

  const handleFinishOrder = useCallback(async () => {
    setShowSuccess(true);

    try {
      const order = {
        ...food,
        extras,
      };

      await api.post('orders', order);
    } catch (err) {
      //
    }

    setTimeout(() => {
      setShowSuccess(false);
      goBack();
    }, 2000);
  }, [extras, food, goBack]);

  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={toggleFavorite}
        />
      ),
    });
  }, [setOptions, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      {showSuccess && (
        <Modal transparent>
          <OverlayContainer>
            <MaterialIcon size={40} color="#39B100" name="thumb-up" />
            <SuccessText>Pedido confirmado!</SuccessText>
          </OverlayContainer>
        </Modal>
      )}

      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={handleFinishOrder}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
