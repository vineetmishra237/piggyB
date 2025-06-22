module gullak::piggy_bank {
    use std::signer;
    use std::error;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;

    // --- Error Codes ---
    const E_NOT_OWNER: u64 = 1;
    const E_PIGGY_BANK_NOT_EXISTS: u64 = 2;
    const E_INSUFFICIENT_BALANCE: u64 = 3;
    const E_GOAL_NOT_REACHED: u64 = 4;
    const E_PIGGY_BANK_ALREADY_EXISTS: u64 = 5;
    const E_INVALID_GOAL_AMOUNT: u64 = 6;
    const E_PIGGY_BANK_LOCKED: u64 = 7;
    const E_NOT_INITIALIZED: u64 = 8;
    const E_ALREADY_INITIALIZED: u64 = 9;

    // --- Resources ---
    struct PiggyBankResourceAccount has key {
        signer_cap: account::SignerCapability,
    }
    struct PiggyBank has key {
        owner: address,
        balance: u64,
        goal_amount: u64,
        created_at: u64,
        last_deposit_at: u64,
        is_locked: bool,
        unlock_time: u64,
        deposit_count: u64,
    }

    // --- Events ---
    #[event]
    struct DepositEvent has drop, store { owner: address, amount: u64, new_balance: u64, timestamp: u64 }
    #[event]
    struct WithdrawEvent has drop, store { owner: address, amount: u64, remaining_balance: u64, timestamp: u64 }
    #[event]
    struct GoalReachedEvent has drop, store { owner: address, goal_amount: u64, final_balance: u64, timestamp: u64 }
    #[event]
    struct PiggyBankCreatedEvent has drop, store { owner: address, goal_amount: u64, timestamp: u64 }

    // --- Entry Functions ---
    public entry fun initialize_vault(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(!exists<PiggyBankResourceAccount>(admin_addr), error::already_exists(E_ALREADY_INITIALIZED));
        let seed = b"PIGGY_BANK_VAULT";
        let (resource_signer, signer_cap) = account::create_resource_account(admin, seed);
        coin::register<AptosCoin>(&resource_signer);
        move_to(admin, PiggyBankResourceAccount { signer_cap });
    }

    public entry fun create_piggy_bank(
        account: &signer,
        goal_amount: u64,
        lock_duration_seconds: u64
    ) {
        let owner = signer::address_of(account);
        assert!(!exists<PiggyBank>(owner), error::already_exists(E_PIGGY_BANK_ALREADY_EXISTS));
        assert!(goal_amount > 0, error::invalid_argument(E_INVALID_GOAL_AMOUNT));
        let current_time = timestamp::now_seconds();
        let piggy_bank = PiggyBank { owner, balance: 0, goal_amount, created_at: current_time, last_deposit_at: 0, is_locked: lock_duration_seconds > 0, unlock_time: current_time + lock_duration_seconds, deposit_count: 0 };
        move_to(account, piggy_bank);
        event::emit(PiggyBankCreatedEvent { owner, goal_amount, timestamp: current_time });
    }

    public entry fun deposit(
        account: &signer,
        amount: u64
    ) acquires PiggyBank, PiggyBankResourceAccount {
        let owner = signer::address_of(account);
        assert!(exists<PiggyBank>(owner), error::not_found(E_PIGGY_BANK_NOT_EXISTS));
        let piggy_bank = borrow_global_mut<PiggyBank>(owner);
        let module_address = @gullak;
        let resource_account = borrow_global<PiggyBankResourceAccount>(module_address);
        let vault_address = account::get_signer_capability_address(&resource_account.signer_cap);
        let coins = coin::withdraw<AptosCoin>(account, amount);
        coin::deposit(vault_address, coins);
        piggy_bank.balance = piggy_bank.balance + amount;
        piggy_bank.last_deposit_at = timestamp::now_seconds();
        piggy_bank.deposit_count = piggy_bank.deposit_count + 1;
        event::emit(DepositEvent { owner, amount, new_balance: piggy_bank.balance, timestamp: timestamp::now_seconds() });
        if (piggy_bank.balance >= piggy_bank.goal_amount) {
            event::emit(GoalReachedEvent { owner, goal_amount: piggy_bank.goal_amount, final_balance: piggy_bank.balance, timestamp: timestamp::now_seconds() });
        };
    }

    public entry fun withdraw(
        account: &signer,
        amount: u64
    ) acquires PiggyBank, PiggyBankResourceAccount {
        let owner = signer::address_of(account);
        assert!(exists<PiggyBank>(owner), error::not_found(E_PIGGY_BANK_NOT_EXISTS));
        let piggy_bank = borrow_global_mut<PiggyBank>(owner);
        if (piggy_bank.is_locked) {
            assert!(timestamp::now_seconds() >= piggy_bank.unlock_time, error::permission_denied(E_PIGGY_BANK_LOCKED));
        };
        assert!(piggy_bank.balance >= amount, error::invalid_argument(E_INSUFFICIENT_BALANCE));
        let module_address = @gullak;
        let resource_account = borrow_global<PiggyBankResourceAccount>(module_address);
        let vault_signer = account::create_signer_with_capability(&resource_account.signer_cap);
        let coins = coin::withdraw<AptosCoin>(&vault_signer, amount);
        coin::deposit(owner, coins);
        piggy_bank.balance = piggy_bank.balance - amount;
        event::emit(WithdrawEvent { owner, amount, remaining_balance: piggy_bank.balance, timestamp: timestamp::now_seconds() });
    }

    public entry fun break_piggy_bank(account: &signer) acquires PiggyBank, PiggyBankResourceAccount {
        let owner = signer::address_of(account);
        assert!(exists<PiggyBank>(owner), error::not_found(E_PIGGY_BANK_NOT_EXISTS));
        let piggy_bank = borrow_global<PiggyBank>(owner);
        let total_balance = piggy_bank.balance;
        if (piggy_bank.is_locked) {
            assert!(timestamp::now_seconds() >= piggy_bank.unlock_time, error::permission_denied(E_PIGGY_BANK_LOCKED));
        };
        if (total_balance > 0) {
            withdraw(account, total_balance);
        };
        let PiggyBank { owner: _, balance: _, goal_amount: _, created_at: _, last_deposit_at: _, is_locked: _, unlock_time: _, deposit_count: _, } = move_from<PiggyBank>(owner);
    }

    public entry fun emergency_withdraw_all(account: &signer) acquires PiggyBank, PiggyBankResourceAccount {
        let owner = signer::address_of(account);
        assert!(exists<PiggyBank>(owner), error::not_found(E_PIGGY_BANK_NOT_EXISTS));
        let piggy_bank = borrow_global_mut<PiggyBank>(owner);
        let total_balance = piggy_bank.balance;
        if (total_balance > 0) {
            let module_address = @gullak;
            let resource_account = borrow_global<PiggyBankResourceAccount>(module_address);
            let vault_signer = account::create_signer_with_capability(&resource_account.signer_cap);
            let coins = coin::withdraw<AptosCoin>(&vault_signer, total_balance);
            coin::deposit(owner, coins);
            piggy_bank.balance = 0;
        };
    }

    // --- View Functions (All restored) ---
    #[view]
    public fun get_piggy_bank_info(owner: address): (u64, u64, u64, u64, bool, u64, u64) acquires PiggyBank {
        assert!(exists<PiggyBank>(owner), error::not_found(E_PIGGY_BANK_NOT_EXISTS));
        let piggy_bank = borrow_global<PiggyBank>(owner);
        ( piggy_bank.balance, piggy_bank.goal_amount, piggy_bank.created_at, piggy_bank.last_deposit_at, piggy_bank.is_locked, piggy_bank.unlock_time, piggy_bank.deposit_count )
    }
    #[view]
    public fun get_balance(owner: address): u64 acquires PiggyBank {
        assert!(exists<PiggyBank>(owner), error::not_found(E_PIGGY_BANK_NOT_EXISTS));
        borrow_global<PiggyBank>(owner).balance
    }
    #[view]
    public fun get_vault_balance(owner: address): u64 acquires PiggyBankResourceAccount { // Parameter restored for compatibility
        let module_address = @gullak;
        let resource_account = borrow_global<PiggyBankResourceAccount>(module_address);
        let vault_address = account::get_signer_capability_address(&resource_account.signer_cap);
        coin::balance<AptosCoin>(vault_address)
    }
    #[view]
    public fun is_goal_reached(owner: address): bool acquires PiggyBank {
        assert!(exists<PiggyBank>(owner), error::not_found(E_PIGGY_BANK_NOT_EXISTS));
        let piggy_bank = borrow_global<PiggyBank>(owner);
        piggy_bank.balance >= piggy_bank.goal_amount
    }
    #[view]
    public fun get_progress_percentage(owner: address): u64 acquires PiggyBank {
        assert!(exists<PiggyBank>(owner), error::not_found(E_PIGGY_BANK_NOT_EXISTS));
        let piggy_bank = borrow_global<PiggyBank>(owner);
        if (piggy_bank.goal_amount == 0) { return 0 };
        let progress = (piggy_bank.balance * 100) / piggy_bank.goal_amount;
        if (progress > 100) { 100 } else { progress }
    }
    #[view]
    public fun is_unlocked(owner: address): bool acquires PiggyBank {
        assert!(exists<PiggyBank>(owner), error::not_found(E_PIGGY_BANK_NOT_EXISTS));
        let piggy_bank = borrow_global<PiggyBank>(owner);
        if (!piggy_bank.is_locked) { return true };
        timestamp::now_seconds() >= piggy_bank.unlock_time
    }
    #[view]
    public fun piggy_bank_exists(owner: address): bool {
        exists<PiggyBank>(owner)
    }
    #[view]
    public fun get_time_until_unlock(owner: address): u64 acquires PiggyBank {
        assert!(exists<PiggyBank>(owner), error::not_found(E_PIGGY_BANK_NOT_EXISTS));
        let piggy_bank = borrow_global<PiggyBank>(owner);
        if (!piggy_bank.is_locked) { return 0 };
        let current_time = timestamp::now_seconds();
        if (current_time >= piggy_bank.unlock_time) { 0 } else { piggy_bank.unlock_time - current_time }
    }
    #[view]
    public fun get_vault_address(): address acquires PiggyBankResourceAccount {
        let module_address = @gullak;
        assert!(exists<PiggyBankResourceAccount>(module_address), error::not_found(E_NOT_INITIALIZED));
        let resource_account = borrow_global<PiggyBankResourceAccount>(module_address);
        account::get_signer_capability_address(&resource_account.signer_cap)
    }
}