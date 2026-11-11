<?php

declare(strict_types=1);

namespace App\Enums;

enum AddonSelectionType: string
{
    case Single = 'single';
    case Multiple = 'multiple';
}
