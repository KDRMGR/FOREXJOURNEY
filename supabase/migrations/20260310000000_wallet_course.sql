-- Migration to add Wallet Education Module (Course)

-- 1. Create the Course
DO $$
DECLARE
  v_course_id uuid;
BEGIN
  -- Insert Course
  INSERT INTO public.courses (title, description, difficulty_level, price, is_published, thumbnail_url)
  VALUES (
    'Crypto Wallet Mastery',
    'Essential guide to securing your digital assets. Learn the difference between hot and cold wallets, and master the setup of MetaMask, Trust Wallet, and Binance Wallet.',
    'beginner',
    0,
    true,
    'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=1000&auto=format&fit=crop'
  )
  RETURNING id INTO v_course_id;

  -- 2. Insert Lessons
  
  -- Lesson 1: Fundamentals
  INSERT INTO public.lessons (course_id, title, content, order_index, duration_minutes)
  VALUES (
    v_course_id,
    'Wallet Fundamentals: Hot vs Cold Storage',
    '# Understanding Crypto Wallets

A cryptocurrency wallet does not actually "store" your coins. Instead, it stores the **private keys** that give you access to your coins on the blockchain.

## Types of Wallets

### 1. Hot Wallets (Online)
These are connected to the internet. They are convenient for frequent trading but less secure.
*   **Examples:** MetaMask, Trust Wallet, Exchange Wallets.
*   **Best for:** Small amounts, daily trading.

### 2. Cold Wallets (Offline)
These are offline devices. They are the most secure way to store crypto.
*   **Examples:** Ledger, Trezor.
*   **Best for:** Long-term holding (HODLing), large amounts.

## Private Keys vs. Seed Phrases
*   **Private Key:** A long string of alphanumeric characters. Access to this equals access to your funds.
*   **Seed Phrase:** A 12-24 word readable phrase that generates your private keys. **NEVER share this.**',
    1,
    10
  );

  -- Lesson 2: MetaMask
  INSERT INTO public.lessons (course_id, title, content, order_index, duration_minutes)
  VALUES (
    v_course_id,
    'Setting up MetaMask',
    '# MetaMask Setup Guide

MetaMask is the most popular browser extension wallet for Ethereum and EVM-compatible chains (BSC, Polygon, Avalanche).

## Step-by-Step
1.  **Download:** Go to the official site (metamask.io) and install the extension for Chrome/Brave/Firefox.
2.  **Create Wallet:** Click "Create a new wallet".
3.  **Password:** Set a strong password for unlocking the app locally.
4.  **Secure Seed Phrase:** Write down your 12-word Secret Recovery Phrase on paper. Do not store it digitally.
5.  **Verify:** Confirm the phrase to prove you wrote it down.

## Adding Networks
By default, MetaMask is on Ethereum Mainnet. To use Binance Smart Chain (BSC), you must add the network details in Settings > Networks.',
    2,
    15
  );

  -- Lesson 3: Trust Wallet
  INSERT INTO public.lessons (course_id, title, content, order_index, duration_minutes)
  VALUES (
    v_course_id,
    'Mobile Security with Trust Wallet',
    '# Trust Wallet Guide

Trust Wallet is a leading mobile wallet that supports multiple blockchains (Bitcoin, Ethereum, Solana, etc.) in one app.

## Key Features
*   **Multi-chain:** Store BTC, ETH, and thousands of other tokens.
*   **DApp Browser:** Access decentralized apps (Uniswap, PancakeSwap) directly from the mobile app (Android/iOS).
*   **Staking:** Earn rewards by staking coins like TRON or ATOM inside the app.

## Setup
1.  Download from App Store / Play Store.
2.  Create Multi-Coin Wallet.
3.  Backup your recovery phrase offline.

## Safety Tip
Always ensure you are downloading the official app. Check the developer name and reviews.',
    3,
    12
  );

  -- Lesson 4: Binance Web3 Wallet
  INSERT INTO public.lessons (course_id, title, content, order_index, duration_minutes)
  VALUES (
    v_course_id,
    'Binance Web3 Wallet Integration',
    '# Binance Web3 Wallet

This is a self-custody wallet integrated directly into the Binance app. It uses MPC (Multi-Party Computation) technology, eliminating the need for a single seed phrase.

## How MPC Works
Instead of one key, the key is split into 3 shares:
1.  Stored on your device.
2.  Stored in your cloud backup (encrypted).
3.  Stored by Binance.

You need 2 of the 3 shares to access the wallet. This makes it easier to recover if you lose your phone, but still secure.

## Setup
1.  Open Binance App > Wallets > Web3.
2.  Click "Create Wallet".
3.  Back up your key share immediately.',
    4,
    10
  );

  -- Lesson 5: Security Best Practices
  INSERT INTO public.lessons (course_id, title, content, order_index, duration_minutes)
  VALUES (
    v_course_id,
    'Ultimate Security Checklist',
    '# Protecting Your Assets

1.  **Never share your Seed Phrase.** Support staff will NEVER ask for it.
2.  **Use a Hardware Wallet** (Ledger/Trezor) for amounts > $1000.
3.  **Check URLs:** Watch out for phishing sites (e.g., meta-mask.com instead of metamask.io).
4.  **Revoke Permissions:** Use tools like Revoke.cash to remove allowances from old DApps.
5.  **Disconnect:** Always disconnect your wallet from sites when finished.

## What if I get hacked?
If your seed phrase is compromised, your funds are gone. There is no "reset password" in crypto. Prevention is the only cure.',
    5,
    8
  );

END $$;
