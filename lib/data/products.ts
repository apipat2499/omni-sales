export interface ShopProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  image?: string;
}

export const shopProducts: ShopProduct[] = [
  {
    id: 1,
    name: "T-Shirt White",
    price: 299,
    stock: 50,
    category: "shirts",
    description: "Classic white t-shirt made from premium cotton. Comfortable and breathable.",
    image: "/placeholder-tshirt-white.png"
  },
  {
    id: 2,
    name: "T-Shirt Black",
    price: 299,
    stock: 45,
    category: "shirts",
    description: "Stylish black t-shirt perfect for any occasion. Premium quality fabric.",
    image: "/placeholder-tshirt-black.png"
  },
  {
    id: 3,
    name: "T-Shirt Blue",
    price: 299,
    stock: 40,
    category: "shirts",
    description: "Cool blue t-shirt with a modern fit. Made from soft, durable material.",
    image: "/placeholder-tshirt-blue.png"
  },
  {
    id: 4,
    name: "Pants Denim",
    price: 599,
    stock: 30,
    category: "pants",
    description: "Classic denim pants with a perfect fit. Durable and stylish.",
    image: "/placeholder-pants-denim.png"
  },
  {
    id: 5,
    name: "Pants Black",
    price: 599,
    stock: 25,
    category: "pants",
    description: "Versatile black pants suitable for casual and formal wear.",
    image: "/placeholder-pants-black.png"
  },
  {
    id: 6,
    name: "Shoes Casual",
    price: 999,
    stock: 15,
    category: "shoes",
    description: "Comfortable casual shoes for everyday wear. Premium leather material.",
    image: "/placeholder-shoes-casual.png"
  },
  {
    id: 7,
    name: "Shoes Sport",
    price: 999,
    stock: 12,
    category: "shoes",
    description: "High-performance sport shoes with excellent cushioning and support.",
    image: "/placeholder-shoes-sport.png"
  },
  {
    id: 8,
    name: "Cap",
    price: 199,
    stock: 60,
    category: "accessories",
    description: "Stylish cap to complete your outfit. One size fits all.",
    image: "/placeholder-cap.png"
  }
];

export const categories = [
  { id: 'all', name: 'All Products' },
  { id: 'shirts', name: 'Shirts' },
  { id: 'pants', name: 'Pants' },
  { id: 'shoes', name: 'Shoes' },
  { id: 'accessories', name: 'Accessories' },
];
