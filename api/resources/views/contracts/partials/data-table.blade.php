<table class="data-table">
    @foreach($rows as $row)
        <tr>
            <td class="label">{{ $row['label'] }}</td>
            <td>{!! nl2br(e($row['value'])) !!}</td>
        </tr>
    @endforeach
</table>
