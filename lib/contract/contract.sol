// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title NFT Battle Game Contract (PolkaVM Optimized)
 * @dev Optimized for PolkaVM's register architecture and multi-dimensional gas model
 * @notice Turn-based battle mechanics with efficient state management and gas optimization
 */
contract NFTBattleGameEVM {
    enum NFTType {
        Fire,
        Water,
        Grass
    }

    struct NFT {
        uint128 attack;
        uint128 defense;
        uint128 intelligence;
        uint128 wisdom;
        uint128 luck;
        uint128 speed;
        uint128 strength;
        NFTType nftType;
    }

    struct Battle {
        uint256 id;
        address player1;
        address player2;
        NFT player1NFT;
        NFT player2NFT;
        uint128 player1CurrentHealth;
        uint128 player2CurrentHealth;
        uint128 player1MaxHealth;
        uint128 player2MaxHealth;
        address currentPlayerTurn;
        bool isOver;
        address winner;
        uint32 turnCount;
        uint32 creationTimestamp;
    }

    struct Move {
        uint32 turnNumber;
        address attacker;
        uint128 damageDealt;
        bool wasCriticalHit;
        uint128 defenderHealthAfter;
    }

    uint256 private constant BASE_MULTIPLIER = 100;
    uint256 private constant CRITICAL_CHANCE_DIVISOR = 20;

    mapping(uint256 => Battle) public battles;
    uint256 public nextBattleId;
    mapping(uint256 => Move[]) public battleMoves;

    event BattleCreated(
        uint256 indexed battleId,
        address indexed player1,
        address indexed player2,
        uint128 player1InitialHealth,
        uint128 player2InitialHealth
    );
    event TurnExecuted(
        uint256 indexed battleId,
        uint32 turnNumber,
        address indexed attacker,
        uint128 damageDealt,
        bool wasCriticalHit,
        uint128 defenderNewHealth
    );
    event BattleEnded(
        uint256 indexed battleId,
        address indexed winner,
        uint32 totalTurns
    );

    modifier battleExists(uint256 _battleId) {
        require(
            battles[_battleId].creationTimestamp > 0,
            "Battle: Does not exist"
        );
        _;
    }

    modifier battleIsOngoing(uint256 _battleId) {
        require(!battles[_battleId].isOver, "Battle: Already over");
        _;
    }

    modifier isPlayerTurn(uint256 _battleId) {
        require(
            battles[_battleId].currentPlayerTurn == msg.sender,
            "Battle: Not your turn"
        );
        _;
    }

    function createBattle(
        address _player2,
        NFT memory _player1NFT,
        NFT memory _player2NFT,
        uint128 _player1InitialHealth,
        uint128 _player2InitialHealth
    ) external returns (uint256 battleId) {
        require(
            _player2 != address(0) && msg.sender != _player2,
            "Battle: Invalid setup"
        );

        battleId = nextBattleId++;
        Battle storage newBattle = battles[battleId];

        newBattle.id = battleId;
        newBattle.player1 = msg.sender;
        newBattle.player2 = _player2;
        newBattle.player1NFT = _player1NFT;
        newBattle.player2NFT = _player2NFT;
        newBattle.creationTimestamp = uint32(block.timestamp);

        newBattle.player1MaxHealth = _player1InitialHealth;
        newBattle.player2MaxHealth = _player2InitialHealth;
        newBattle.player1CurrentHealth = _player1InitialHealth;
        newBattle.player2CurrentHealth = _player2InitialHealth;

        // determine first player based on speed (no branching optimization)
        newBattle.currentPlayerTurn = _player1NFT.speed >= _player2NFT.speed
            ? newBattle.player1
            : newBattle.player2;

        emit BattleCreated(
            battleId,
            newBattle.player1,
            newBattle.player2,
            newBattle.player1CurrentHealth,
            newBattle.player2CurrentHealth
        );
        return battleId;
    }

    function executeTurn(
        uint256 _battleId
    )
        external
        battleExists(_battleId)
        battleIsOngoing(_battleId)
        isPlayerTurn(_battleId)
        returns (
            uint128 P1Health,
            uint128 P2Health,
            bool IsOver,
            address WinnerAddress
        )
    {
        Battle storage battle = battles[_battleId];
        battle.turnCount++;

        (
            uint128 damageDealt,
            bool wasCritical,
            uint128 finalDefenderHealth,
            address attacker,
            address defender
        ) = _processTurn(battle);

        battleMoves[_battleId].push(
            Move({
                turnNumber: battle.turnCount,
                attacker: attacker,
                damageDealt: damageDealt,
                wasCriticalHit: wasCritical,
                defenderHealthAfter: finalDefenderHealth
            })
        );

        emit TurnExecuted(
            _battleId,
            battle.turnCount,
            attacker,
            damageDealt,
            wasCritical,
            finalDefenderHealth
        );

        if (finalDefenderHealth == 0) {
            battle.isOver = true;
            battle.winner = attacker;
            emit BattleEnded(_battleId, battle.winner, battle.turnCount);
        } else {
            battle.currentPlayerTurn = defender;
        }

        return (
            battle.player1CurrentHealth,
            battle.player2CurrentHealth,
            battle.isOver,
            battle.winner
        );
    }

    function _processTurn(
        Battle storage _battle
    )
        internal
        returns (
            uint128 damageDealt,
            bool wasCritical,
            uint128 finalDefenderHealth,
            address attackerAddress,
            address defenderAddress
        )
    {
        attackerAddress = _battle.currentPlayerTurn;

        NFT memory attackerNFT;
        NFT memory defenderNFT;
        uint128 defenderOriginalHealth;

        if (attackerAddress == _battle.player1) {
            attackerNFT = _battle.player1NFT;
            defenderNFT = _battle.player2NFT;
            defenderAddress = _battle.player2;
            defenderOriginalHealth = _battle.player2CurrentHealth;
        } else {
            attackerNFT = _battle.player2NFT;
            defenderNFT = _battle.player1NFT;
            defenderAddress = _battle.player1;
            defenderOriginalHealth = _battle.player1CurrentHealth;
        }

        (damageDealt, wasCritical) = _calculateDamage(
            attackerNFT,
            defenderNFT,
            _battle.id,
            _battle.turnCount
        );

        finalDefenderHealth = defenderOriginalHealth <= damageDealt
            ? 0
            : defenderOriginalHealth - damageDealt;

        if (attackerAddress == _battle.player1) {
            _battle.player2CurrentHealth = finalDefenderHealth;
        } else {
            _battle.player1CurrentHealth = finalDefenderHealth;
        }
    }

    function _calculateDamage(
        NFT memory _attacker,
        NFT memory _defender,
        uint256 _battleId,
        uint32 _turnCount
    ) internal view returns (uint128 damage, bool isCritical) {
        uint256 baseDamage = (_attacker.attack / 5) + (_attacker.strength / 10);
        baseDamage = baseDamage == 0 ? 1 : baseDamage;

        uint256 speedModifier = (baseDamage * _attacker.speed) /
            (BASE_MULTIPLIER * 5);
        uint256 tacticalDamage = (baseDamage * _attacker.intelligence) /
            (BASE_MULTIPLIER * 4);

        uint256 pseudoRandom = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    _attacker.luck,
                    _defender.defense,
                    _battleId,
                    _turnCount
                )
            )
        ) % 100;

        uint256 criticalChance = (_attacker.luck / CRITICAL_CHANCE_DIVISOR) + 5;
        criticalChance = criticalChance > 50 ? 50 : criticalChance;
        isCritical = pseudoRandom < criticalChance;

        uint256 rawDamage = baseDamage + speedModifier + tacticalDamage;

        // apply type effectiveness: Fire > Grass > Water > Fire
        uint256 typeMultiplier = _getTypeEffectiveness(
            _attacker.nftType,
            _defender.nftType
        );
        rawDamage = (rawDamage * typeMultiplier) / 100;

        rawDamage = isCritical ? (rawDamage * 150) / 100 : rawDamage;

        uint256 totalDefense = (_defender.defense / 4) + (_defender.wisdom / 8);
        uint256 damageReduction = (rawDamage * totalDefense) /
            (totalDefense + 25);

        damage = rawDamage > damageReduction
            ? uint128(rawDamage - damageReduction)
            : 0;

        // ensure minimum damage for critical hits
        if (damage == 0 && rawDamage > 0) damage = 1;
        if (isCritical && damage < 2 && rawDamage > 1) {
            damage = rawDamage / 2 > 1 ? uint128(rawDamage / 2) : 2;
        }
    }

    function _getTypeEffectiveness(
        NFTType _attackerType,
        NFTType _defenderType
    ) internal pure returns (uint256 multiplier) {
        // Fire > Grass, Water > Fire, Grass > Water
        if (_attackerType == NFTType.Fire && _defenderType == NFTType.Grass)
            return 150; // Super effective
        if (_attackerType == NFTType.Water && _defenderType == NFTType.Fire)
            return 150; // Super effective
        if (_attackerType == NFTType.Grass && _defenderType == NFTType.Water)
            return 150; // Super effective

        if (_attackerType == NFTType.Fire && _defenderType == NFTType.Water)
            return 50; // Not very effective
        if (_attackerType == NFTType.Water && _defenderType == NFTType.Grass)
            return 50; // Not very effective
        if (_attackerType == NFTType.Grass && _defenderType == NFTType.Fire)
            return 50; // Not very effective

        return 100; // Normal effectiveness
    }

    function getBattleState(
        uint256 _battleId
    ) external view battleExists(_battleId) returns (Battle memory) {
        return battles[_battleId];
    }

    function getBattleMoves(
        uint256 _battleId
    ) external view battleExists(_battleId) returns (Move[] memory) {
        return battleMoves[_battleId];
    }

    function getPlayerHealthPercentage(
        uint256 _battleId,
        address _playerAddress
    ) external view battleExists(_battleId) returns (uint256 percentage) {
        Battle storage battle = battles[_battleId];
        uint128 currentHealth;
        uint128 maxHealth;

        if (_playerAddress == battle.player1) {
            currentHealth = battle.player1CurrentHealth;
            maxHealth = battle.player1MaxHealth;
        } else if (_playerAddress == battle.player2) {
            currentHealth = battle.player2CurrentHealth;
            maxHealth = battle.player2MaxHealth;
        } else {
            revert("Battle: Player not in this battle");
        }

        return
            maxHealth == 0
                ? 0
                : (uint256(currentHealth) * 100) / uint256(maxHealth);
    }

    function isBattleOver(
        uint256 _battleId
    ) external view battleExists(_battleId) returns (bool) {
        return battles[_battleId].isOver;
    }
}
