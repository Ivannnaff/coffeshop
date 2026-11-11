<?php

declare(strict_types=1);

namespace App\Domain\Order\Exceptions;

use RuntimeException;

class InvalidOrderTransitionException extends RuntimeException
{
    public static function because(string $from, string $to): self
    {
        return new self("Transisi status pesanan dari [{$from}] ke [{$to}] tidak diizinkan.");
    }

    public static function becauseActor(string $from, string $to, string $actorType): self
    {
        return new self("Aktor [{$actorType}] tidak berwenang melakukan transisi [{$from}] ke [{$to}].");
    }
}
